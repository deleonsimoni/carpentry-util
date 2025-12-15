/**
 * Seed script para testar Multi-Tenancy
 *
 * Este script cria:
 * - 3 empresas de teste
 * - 1 carpinteiro que pertence a TODAS as 3 empresas (para testar multi-tenancy)
 * - 1 manager para cada empresa
 *
 * Para executar:
 *   node server/scripts/seed-multi-tenancy.js
 *
 * Credenciais do carpinteiro multi-empresa:
 *   Email: multicompany@test.com
 *   Senha: Test123!
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Conectar ao MongoDB
const MONGO_URI = process.env.MONGO_HOST || 'mongodb://localhost:27017/carpentryutildb';

console.log('🔌 Conectando ao MongoDB:', MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => {
    console.error('❌ Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });

// Schemas simplificados
const CompanySchema = new mongoose.Schema({
  name: String,
  businessNumber: String,
  address: {
    street: String,
    city: String,
    province: String,
    postalCode: String,
    country: { type: String, default: 'Canada' }
  },
  phone: String,
  companyEmail: String,
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

const UserSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  companies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],
  activeCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  fullname: String,
  email: { type: String, unique: true },
  hashedPassword: String,
  roles: [String],
  profile: String,
  status: { type: String, default: 'active' },
  requirePasswordChange: { type: Boolean, default: false },
  temporaryPassword: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

const Company = mongoose.model('Company', CompanySchema);
const User = mongoose.model('User', UserSchema);

async function seed() {
  try {
    console.log('\n📦 Iniciando seed de Multi-Tenancy...\n');

    // ========================================
    // 1. Criar 3 empresas de teste
    // ========================================
    console.log('🏢 Criando empresas...');

    const companies = await Company.insertMany([
      {
        name: 'Alpha Construction Ltd',
        businessNumber: 'BN-ALPHA-001',
        address: {
          street: '123 Main Street',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M5V 1A1',
          country: 'Canada'
        },
        phone: '(416) 555-0001',
        companyEmail: 'contact@alphaconstruction.ca',
        status: 'active'
      },
      {
        name: 'Beta Carpentry Inc',
        businessNumber: 'BN-BETA-002',
        address: {
          street: '456 Oak Avenue',
          city: 'Vancouver',
          province: 'BC',
          postalCode: 'V6B 2W2',
          country: 'Canada'
        },
        phone: '(604) 555-0002',
        companyEmail: 'info@betacarpentry.ca',
        status: 'active'
      },
      {
        name: 'Gamma Woodworks Co',
        businessNumber: 'BN-GAMMA-003',
        address: {
          street: '789 Pine Road',
          city: 'Calgary',
          province: 'AB',
          postalCode: 'T2P 3C4',
          country: 'Canada'
        },
        phone: '(403) 555-0003',
        companyEmail: 'hello@gammawoodworks.ca',
        status: 'active'
      }
    ]);

    console.log('   ✅ Empresa criada: Alpha Construction Ltd');
    console.log('   ✅ Empresa criada: Beta Carpentry Inc');
    console.log('   ✅ Empresa criada: Gamma Woodworks Co');

    const [alphaCompany, betaCompany, gammaCompany] = companies;

    // ========================================
    // 2. Criar managers para cada empresa
    // ========================================
    console.log('\n👔 Criando managers...');

    const hashedPassword = bcrypt.hashSync('Test123!', 10);

    // Verificar e remover usuários existentes com esses emails
    await User.deleteMany({
      email: {
        $in: [
          'manager.alpha@test.com',
          'manager.beta@test.com',
          'manager.gamma@test.com',
          'multicompany@test.com'
        ]
      }
    });

    const managers = await User.insertMany([
      {
        fullname: 'Manager Alpha',
        email: 'manager.alpha@test.com',
        hashedPassword,
        roles: ['manager'],
        profile: 'manager',
        company: alphaCompany._id,
        companies: [alphaCompany._id],
        activeCompany: alphaCompany._id,
        status: 'active',
        requirePasswordChange: false,
        temporaryPassword: false,
        isVerified: true
      },
      {
        fullname: 'Manager Beta',
        email: 'manager.beta@test.com',
        hashedPassword,
        roles: ['manager'],
        profile: 'manager',
        company: betaCompany._id,
        companies: [betaCompany._id],
        activeCompany: betaCompany._id,
        status: 'active',
        requirePasswordChange: false,
        temporaryPassword: false,
        isVerified: true
      },
      {
        fullname: 'Manager Gamma',
        email: 'manager.gamma@test.com',
        hashedPassword,
        roles: ['manager'],
        profile: 'manager',
        company: gammaCompany._id,
        companies: [gammaCompany._id],
        activeCompany: gammaCompany._id,
        status: 'active',
        requirePasswordChange: false,
        temporaryPassword: false,
        isVerified: true
      }
    ]);

    console.log('   ✅ Manager criado: manager.alpha@test.com (Alpha Construction)');
    console.log('   ✅ Manager criado: manager.beta@test.com (Beta Carpentry)');
    console.log('   ✅ Manager criado: manager.gamma@test.com (Gamma Woodworks)');

    // ========================================
    // 3. Criar carpinteiro MULTI-EMPRESA
    // ========================================
    console.log('\n🔨 Criando carpinteiro multi-empresa...');

    const multiCompanyCarpenter = await User.create({
      fullname: 'João Multi-Empresa',
      email: 'multicompany@test.com',
      hashedPassword,
      roles: ['carpenter'],
      profile: 'carpenter',
      // Pertence a TODAS as 3 empresas
      companies: [alphaCompany._id, betaCompany._id, gammaCompany._id],
      // Empresa ativa inicial (será mostrada a seleção no login)
      company: null,  // Sem empresa ativa - forçará seleção
      activeCompany: null,
      status: 'active',
      requirePasswordChange: false,
      temporaryPassword: false,
      isVerified: true
    });

    console.log('   ✅ Carpinteiro criado: multicompany@test.com');
    console.log('      📋 Empresas: Alpha Construction, Beta Carpentry, Gamma Woodworks');

    // ========================================
    // Resumo
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('\n📝 CREDENCIAIS PARA TESTE:\n');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│  CARPINTEIRO MULTI-EMPRESA (para testar multi-tenancy) │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│  Email: multicompany@test.com                          │');
    console.log('│  Senha: Test123!                                       │');
    console.log('│  Empresas: Alpha, Beta, Gamma (3 empresas)             │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│  MANAGERS (cada um em 1 empresa)                       │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│  manager.alpha@test.com - Alpha Construction           │');
    console.log('│  manager.beta@test.com  - Beta Carpentry               │');
    console.log('│  manager.gamma@test.com - Gamma Woodworks              │');
    console.log('│  Senha (todos): Test123!                               │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('\n🧪 COMO TESTAR:');
    console.log('   1. Faça login com multicompany@test.com');
    console.log('   2. Você verá a tela de seleção de empresa');
    console.log('   3. Selecione uma empresa para entrar');
    console.log('   4. No sidebar, use o dropdown para trocar de empresa');
    console.log('');

  } catch (error) {
    console.error('\n❌ Erro durante o seed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexão com MongoDB fechada');
    process.exit(0);
  }
}

// Executar
seed();
