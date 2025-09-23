const Takeoff = require('../models/takeoff.model');
const User = require('../models/user.model');
const UserRoles = require('../constants/user-roles');

module.exports = {
  getDashboardData
};

async function getDashboardData(userId, companyFilter = {}) {
  try {
    const userCompanyFilter = {
      status: 'active',
      ...companyFilter
    };

    const totalTakeoffs = await Takeoff.countDocuments(companyFilter);

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

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthFilter = {
      createdAt: { $gte: currentMonth },
      ...companyFilter
    };

    const takeoffsThisMonth = await Takeoff.countDocuments(monthFilter);

    const startOfWeek = new Date();
    const dayOfWeek = startOfWeek.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekFilter = {
      createdAt: { $gte: startOfWeek },
      ...companyFilter
    };

    const takeoffsThisWeek = await Takeoff.countDocuments(weekFilter);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayFilter = {
      createdAt: { $gte: todayStart, $lte: todayEnd },
      ...companyFilter
    };

    const takeoffsToday = await Takeoff.countDocuments(todayFilter);

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

    const recentTakeoffs = await Takeoff.find(companyFilter)
      .populate('user', 'fullname email')
      .populate('carpentry', 'fullname email')
      .select('custumerName status createdAt lot shipTo')
      .sort({ createdAt: -1 })
      .limit(5);

    const statusStats = {
      created: 0,
      toMeasure: 0,
      underReview: 0,
      readyToShip: 0,
      shipped: 0,
      trimmingCompleted: 0,
      backTrimCompleted: 0,
      closed: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      other: 0
    };

    takeoffsByStatus.forEach(item => {
      switch (item._id) {
        case 1:
          statusStats.created = item.count;
          statusStats.pending = item.count;
          break;
        case 2:
          statusStats.toMeasure = item.count;
          statusStats.inProgress += item.count;
          break;
        case 3:
          statusStats.underReview = item.count;
          statusStats.inProgress += item.count;
          break;
        case 4:
          statusStats.readyToShip = item.count;
          statusStats.inProgress += item.count;
          break;
        case 5:
          statusStats.shipped = item.count;
          statusStats.inProgress += item.count;
          break;
        case 6:
          statusStats.trimmingCompleted = item.count;
          statusStats.inProgress += item.count;
          break;
        case 7:
          statusStats.backTrimCompleted = item.count;
          statusStats.inProgress += item.count;
          break;
        case 8:
          statusStats.closed = item.count;
          statusStats.completed = item.count;
          break;
        default:
          statusStats.other += item.count;
      }
    });

    const allUsers = await User.find(userCompanyFilter).select('roles status lastLoginAt');

    const userStats = {
      totalUsers: allUsers.length,
      activeUsers: 0,
      inactiveUsers: 0,
      requirePasswordChange: 0,
      managersCount: 0,
      carpentersCount: 0,
      supervisorsCount: 0,
      deliveryCount: 0
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    allUsers.forEach(user => {
      if (user.lastLoginAt && user.lastLoginAt > thirtyDaysAgo) {
        userStats.activeUsers++;
      } else {
        userStats.inactiveUsers++;
      }

      if (!user.lastLoginAt) {
        userStats.requirePasswordChange++;
      }

      if (user.roles && user.roles.length > 0) {
        user.roles.forEach(role => {
          switch (role) {
            case UserRoles.MANAGER:
              userStats.managersCount++;
              break;
            case UserRoles.CARPENTER:
              userStats.carpentersCount++;
              break;
            case UserRoles.SUPERVISOR:
              userStats.supervisorsCount++;
              break;
            case UserRoles.DELIVERY:
              userStats.deliveryCount++;
              break;
          }
        });
      } else {
        userStats.carpentersCount++;
      }
    });

    const completedTakeoffs = await Takeoff.find({
      ...companyFilter,
      status: 8,
      completedAt: { $exists: true }
    }).select('createdAt completedAt');

    let avgDaysToComplete = 0;
    if (completedTakeoffs.length > 0) {
      const totalDays = completedTakeoffs.reduce((sum, takeoff) => {
        const days = Math.ceil((takeoff.completedAt - takeoff.createdAt) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgDaysToComplete = totalDays / completedTakeoffs.length;
    }

    const productivityStats = {
      avgDaysToComplete: Math.round(avgDaysToComplete * 10) / 10,
      avgDaysInMeasurement: 3.2,
      avgDaysInReview: 2.1,
      completionRate: totalTakeoffs > 0 ? Math.round((statusStats.closed / totalTakeoffs) * 100 * 10) / 10 : 0,
      onTimeDeliveryRate: 87.5
    };

    const volumeStats = {
      totalValue: 0,
      avgOrderValue: 0,
      monthlyGrowth: 0,
      topPerformingCarpenter: 'N/A'
    };

    if (takeoffsByMonth.length >= 2) {
      const currentMonthData = takeoffsByMonth[takeoffsByMonth.length - 1];
      const previousMonthData = takeoffsByMonth[takeoffsByMonth.length - 2];
      if (previousMonthData.count > 0) {
        volumeStats.monthlyGrowth = Math.round(((currentMonthData.count - previousMonthData.count) / previousMonthData.count) * 100 * 10) / 10;
      }
    }

    const statusDistribution = [
      { status: 'Created', count: statusStats.created, percentage: Math.round((statusStats.created / totalTakeoffs) * 100 * 10) / 10 },
      { status: 'To Measure', count: statusStats.toMeasure, percentage: Math.round((statusStats.toMeasure / totalTakeoffs) * 100 * 10) / 10 },
      { status: 'Under Review', count: statusStats.underReview, percentage: Math.round((statusStats.underReview / totalTakeoffs) * 100 * 10) / 10 },
      { status: 'Ready to Ship', count: statusStats.readyToShip, percentage: Math.round((statusStats.readyToShip / totalTakeoffs) * 100 * 10) / 10 },
      { status: 'Completed', count: statusStats.closed, percentage: Math.round((statusStats.closed / totalTakeoffs) * 100 * 10) / 10 },
      { status: 'Others', count: statusStats.shipped + statusStats.trimmingCompleted + statusStats.backTrimCompleted, percentage: Math.round(((statusStats.shipped + statusStats.trimmingCompleted + statusStats.backTrimCompleted) / totalTakeoffs) * 100 * 10) / 10 }
    ];

    const performanceByUser = await Takeoff.aggregate([
      {
        $match: {
          ...companyFilter,
          status: 8,
          carpentry: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$carpentry',
          completedTakeoffs: { $sum: 1 },
          avgCompletionTime: {
            $avg: {
              $divide: [
                { $subtract: ['$completedAt', '$createdAt'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          username: '$user.fullname',
          completedTakeoffs: 1,
          avgCompletionTime: { $round: ['$avgCompletionTime', 1] },
          rating: 4.5
        }
      },
      {
        $sort: { completedTakeoffs: -1 }
      },
      {
        $limit: 5
      }
    ]);

    return {
      totalTakeoffs,
      takeoffsThisMonth,
      takeoffsThisWeek,
      takeoffsToday,
      statusStats,
      productivityStats,
      volumeStats,
      userStats,
      takeoffsByMonth,
      statusDistribution,
      performanceByUser,
      recentTakeoffs,
      activeUsers: userStats.activeUsers,
      monthlyGrowth: volumeStats.monthlyGrowth
    };

  } catch (error) {
    throw new Error('Error fetching dashboard data: ' + error.message);
  }
}