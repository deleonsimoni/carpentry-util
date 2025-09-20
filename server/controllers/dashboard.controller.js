const Takeoff = require('../models/takeoff.model');
const User = require('../models/user.model');

module.exports = {
  getDashboardData
};

async function getDashboardData(userId, companyFilter = {}) {
  try {
    // Filtros de empresa baseados no header
    const userCompanyFilter = {
      status: 'active',
      ...companyFilter
    };

    // Total de takeoffs
    const totalTakeoffs = await Takeoff.countDocuments(companyFilter);

    // Takeoffs por status
    const takeoffsByStatus = await Takeoff.aggregate([
      {
        $match: companyFilter
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Total de usuários ativos
    const activeUsers = await User.countDocuments(userCompanyFilter);

    // Takeoffs do mês atual
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthFilter = {
      createdAt: { $gte: currentMonth },
      ...companyFilter
    };

    const takeoffsThisMonth = await Takeoff.countDocuments(monthFilter);

    // Takeoffs dos últimos 6 meses para gráfico
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const sixMonthFilter = {
      createdAt: { $gte: sixMonthsAgo },
      ...companyFilter
    };

    const takeoffsByMonth = await Takeoff.aggregate([
      {
        $match: sixMonthFilter
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Takeoffs recentes
    const recentTakeoffs = await Takeoff.find(companyFilter)
      .populate('user', 'fullname email')
      .populate('carpentry', 'fullname email')
      .select('custumerName status createdAt lot shipTo')
      .sort({ createdAt: -1 })
      .limit(5);

    // Calcular estatísticas de status
    const statusStats = {
      pending: 0,    // status 1
      inProgress: 0, // status 2
      completed: 0,  // status 3
      other: 0
    };

    takeoffsByStatus.forEach(item => {
      switch (item._id) {
        case 1:
          statusStats.pending = item.count;
          break;
        case 2:
          statusStats.inProgress = item.count;
          break;
        case 3:
          statusStats.completed = item.count;
          break;
        default:
          statusStats.other += item.count;
      }
    });

    return {
      totalTakeoffs,
      activeUsers,
      takeoffsThisMonth,
      statusStats,
      takeoffsByMonth,
      recentTakeoffs
    };

  } catch (error) {
    throw new Error('Error fetching dashboard data: ' + error.message);
  }
}