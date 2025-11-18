const bcrypt = require('bcrypt');
const Joi = require('joi');
const User = require('../models/user.model');
const UserRoles = require('../constants/user-roles');
const Company = require('../models/company.model');
const sendgridCtrl = require('./sendgrid.controller');
const S3Uploader = require('./aws.controller');
const { v5: uuidv5 } = require('uuid');

module.exports = {
  insert,
  updateImageUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  generateTemporaryPassword,
  changePassword,
  checkPasswordStatus,
};

async function insert(user, verificationCode) {

  user.verificationCode = verificationCode;
  user.hashedPassword = bcrypt.hashSync(user.password, 10);
  user.email = user.email.toLowerCase();

  // Detectar automaticamente o tipo de usuário baseado nos dados
  const isManagerRegistration = user.company && typeof user.company === 'object' && user.company.name;

  // Garantir que roles seja um array válido
  if (!user.roles || !Array.isArray(user.roles)) {
    user.roles = [];
  }

  // Se é registro de manager (tem dados de company), definir como manager automaticamente
  if (isManagerRegistration) {
    user.roles = [UserRoles.MANAGER];
    user.profile = UserRoles.MANAGER;
  } else {
    // Se profile não foi definido, usar CARPENTER como padrão
    if (!user.profile) {
      user.profile = UserRoles.CARPENTER;
    }
  }

  // Validar se o profile é válido
  if (!UserRoles.isValidRole(user.profile)) {
    throw new Error(`Profile inválido: ${user.profile}. Valores válidos: ${UserRoles.getAllRoles().join(', ')}`);
  }

  // Adicionar o profile aos roles se não estiver presente
  if (!user.roles.includes(user.profile)) {
    user.roles.push(user.profile);
  }

  // Para usuários com role manager, garantir que profile está correto
  if (UserRoles.isManager(user.roles)) {
    user.profile = UserRoles.MANAGER;
    // Managers não precisam trocar senha após registro
    user.requirePasswordChange = false;
    user.temporaryPassword = false;
    console.log('✅ DEBUG - Profile definido como:', user.profile);
    console.log('✅ DEBUG - requirePasswordChange:', user.requirePasswordChange);
    console.log('✅ DEBUG - temporaryPassword:', user.temporaryPassword);
  } else {
    console.log('❌ DEBUG - NÃO é manager');
  }

  // Se há dados da empresa (registro de manager), criar a empresa primeiro
  if (user.company && typeof user.company === 'object' && user.company.name) {
    try {
      // Criar a empresa
      const companyData = {
        ...user.company,
        createdBy: null // Será definido depois que o usuário for criado
      };

      const company = new Company(companyData);
      const savedCompany = await company.save();

      // Substituir o objeto company pelo ID da empresa criada
      user.company = savedCompany._id;

      // Depois de criar o usuário, atualizar a empresa com o createdBy
      delete user.password;
      const savedUser = await new User(user).save();

      // Atualizar a empresa com o ID do usuário criador
      await Company.findByIdAndUpdate(savedCompany._id, { createdBy: savedUser._id });

      return savedUser;
    } catch (error) {
      console.error('Error creating company during user registration:', error);
      throw new Error('Erro ao criar empresa: ' + error.message);
    }
  }

  delete user.password;
  return await new User(user).save();
}

async function updateImageUser(user, img) {
  let retorno = {
    temErro: false,
    mensagem: '',
    filesS3: [],
  };

  let fileName =
    'images/public/' + uuidv5(user._id.toString(), uuidv5.URL) + '.jpg';

  let buf = Buffer.from(
    img.content.replace(/^data:image\/\w+;base64,/, ''),
    'base64'
  );

  await S3Uploader.uploadImage(fileName, buf).then(
    fileData => {
      return User.findOneAndUpdate(
        {
          _id: user._id,
        },
        { image: fileName }
      );
    },
    err => {
      console.error('Erro ao enviar imagem de perfil para AWS:', fileName, err);
      retorno.temErro = true;
      retorno.mensagem =
        'Servidor momentaneamente inoperante. Tente novamente mais tarde.';
    }
  );

  return await retorno;
}

// Função para gerar senha temporária
function generateTemporaryPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Listar todos os usuários com paginação e filtros
async function getAllUsers(query, companyFilter = {}) {
  const {
    page = 1,
    limit = 10,
    search = '',
    profile = '',
    status = ''
  } = query;

  // Construir filtros de busca
  const filters = {
    ...companyFilter
  };

  if (search) {
    filters.$or = [
      { fullname: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (profile) {
    filters.profile = profile;
  }

  if (status) {
    filters.status = status;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    select: '-hashedPassword' // Não retornar senha
  };

  const users = await User.find(filters)
    .select(options.select)
    .sort(options.sort)
    .limit(options.limit * 1)
    .skip((options.page - 1) * options.limit);

  const total = await User.countDocuments(filters);

  return {
    users,
    totalPages: Math.ceil(total / options.limit),
    currentPage: options.page,
    totalUsers: total
  };
}

// Criar novo usuário
async function createUser(userData, companyFilter = {}, currentUser = null) {
  const schema = Joi.object({
    fullname: Joi.string().required(),
    email: Joi.string().email().required(),
    profile: Joi.string().valid(UserRoles.SUPERVISOR, UserRoles.DELIVERY, UserRoles.MANAGER, UserRoles.CARPENTER).required(),
    mobilePhone: Joi.string().optional(),
    homePhone: Joi.string().optional(),
    hstRegistrationNumber: Joi.string().required(),
    companyName: Joi.string().required(),
    address: Joi.object().optional(),
    socialMedia: Joi.object().optional()
  });

  const { error, value } = schema.validate(userData);
  if (error) {
    throw new Error(error.details[0].message);
  }

  // Verificar se email já existe
  const existingUser = await User.findOne({ email: value.email.toLowerCase() });
  if (existingUser) {
    throw new Error('Email já está em uso');
  }

  // Gerar senha temporária
  const temporaryPassword = generateTemporaryPassword();

  const newUser = {
    ...value,
    email: value.email.toLowerCase(),
    hashedPassword: bcrypt.hashSync(temporaryPassword, 10),
    requirePasswordChange: value.profile !== UserRoles.MANAGER, // Managers não precisam trocar senha
    temporaryPassword: value.profile !== UserRoles.MANAGER, // Managers não têm senha temporária
    roles: [value.profile], // Adicionar profile aos roles também
    status: 'active',
    company: companyFilter.company || null
  };

  const user = await new User(newUser).save();
  const userResponse = user.toObject();
  delete userResponse.hashedPassword;

  const emailSent = await sendVerificationEmail( value.email.toLowerCase(), temporaryPassword);

  return {
    user: userResponse,
    temporaryPassword: temporaryPassword,
    message: `Usuário criado com sucesso. Senha temporária: ${temporaryPassword}`
  };
}

async function sendVerificationEmail(email, codEmail) {
  
  const subject = "Welcome to CarpentryGo - This is your command to access your account";
  const loginUrl = `https://carpentrygo.ca/login`;

  const html=`
    <h2>Welcome to CarpentryGo 🎉</h2>
    <p>Hello, </p>
    <p>Your password has been successfully created.</p>
    <div style="background:#f5f5f5;padding:10px 20px;border-radius:6px;
                  display:inline-block;font-weight:bold;font-size:1.1rem;
                  color:#004a80;margin:15px 0;">
        ${codEmail}
      </div>

      <p>For security reasons, we recommend changing this password after logging in.</p>

      <a href="${loginUrl}"
        style="display:inline-block;padding:10px 20px;background:#004a80;
                color:#fff;text-decoration:none;border-radius:5px;
                font-weight:bold;margin:15px 0;">
        Go to Login Page
      </a>

      <p>If you didn’t request this change, please contact our support team immediately.</p>
      <p>– The CarpentryGO Team</p>
  `;

  await sendgridCtrl.enviarEmail(email, subject, html);

}

// Buscar usuário por ID
async function getUserById(id, companyFilter = {}) {
  // Construir filtros para tenancy
  const filters = {
    _id: id,
    ...companyFilter
  };

  const user = await User.findOne(filters).select('-hashedPassword');
  if (!user) {
    throw new Error('Usuário não encontrado');
  }
  return user;
}

// Atualizar usuário
async function updateUser(id, updateData, companyFilter = {}, currentUser = null) {
  const schema = Joi.object({
    fullname: Joi.string().optional(),
    profile: Joi.string().valid(UserRoles.SUPERVISOR, UserRoles.DELIVERY, UserRoles.MANAGER, UserRoles.CARPENTER).optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    mobilePhone: Joi.string().optional(),
    homePhone: Joi.string().optional(),
    hstRegistrationNumber: Joi.string().optional(),
    companyName: Joi.string().optional(),
    address: Joi.object().optional(),
    socialMedia: Joi.object().optional()
  });

  const { error, value } = schema.validate(updateData);
  if (error) {
    throw new Error(error.details[0].message);
  }

  // Se mudou o profile, atualizar roles também
  if (value.profile) {
    value.roles = [value.profile];
  }

  // Construir filtros para tenancy
  const filters = {
    _id: id,
    ...companyFilter
  };

  const user = await User.findOneAndUpdate(
    filters,
    value,
    { new: true, runValidators: true }
  ).select('-hashedPassword');

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  return user;
}

// Inativar usuário (soft delete)
async function deleteUser(id, companyFilter = {}) {
  // Construir filtros para tenancy
  const filters = {
    _id: id,
    ...companyFilter
  };

  const user = await User.findOneAndUpdate(
    filters,
    { status: 'inactive' },
    { new: true }
  ).select('-hashedPassword');

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  return user;
}

// Verificar status da senha (se precisa trocar)
async function checkPasswordStatus(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  return {
    requirePasswordChange: user.requirePasswordChange,
    temporaryPassword: user.temporaryPassword
  };
}

// Alterar senha (primeiro login ou mudança de senha)
async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  // Verificar senha atual
  const isCurrentPasswordValid = bcrypt.compareSync(currentPassword, user.hashedPassword);
  if (!isCurrentPasswordValid) {
    throw new Error('Senha atual incorreta');
  }

  // Validar nova senha
  if (newPassword.length < 6) {
    throw new Error('Nova senha deve ter pelo menos 6 caracteres');
  }

  // Hash da nova senha
  const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

  // Atualizar usuário
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      hashedPassword: hashedNewPassword,
      requirePasswordChange: false,
      temporaryPassword: false,
      isVerified:true,
      lastLogin: new Date()
    },
    { new: true }
  ).select('-hashedPassword');

  return {
    message: 'Senha alterada com sucesso',
    user: updatedUser
  };
}

// Reset de senha de usuário (gerar nova senha temporária)
async function resetUserPassword(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  // Gerar nova senha temporária
  const temporaryPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  // Atualizar usuário
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      hashedPassword: hashedPassword,
      requirePasswordChange: true,
      temporaryPassword: true
    },
    { new: true }
  ).select('-hashedPassword');

    const emailSent = await sendVerificationEmail( user.email, temporaryPassword);


  return {
    message: 'Password reset successfully. New temporary password generated.',
    user: updatedUser,
    temporaryPassword: temporaryPassword
  };
}

module.exports = {
  insert,
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  checkPasswordStatus,
  changePassword,
  resetUserPassword
};
