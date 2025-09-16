import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);
//
// Chart extension for making the bars rounded
// Code from: https://codepen.io/jedtrow/full/ygRYgo
//

// Chart.js 4.x has built-in support for rounded bars via borderRadius property
// No need for custom plugin

var mode = 'light';//(themeMode) ? themeMode : 'light';
var fonts = {
  base: 'Open Sans'
}

// Colors
var colors = {
  gray: {
    100: '#f6f9fc',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#8898aa',
    700: '#525f7f',
    800: '#32325d',
    900: '#212529'
  },
  theme: {
    'default': '#172b4d',
    'primary': '#5e72e4',
    'secondary': '#f4f5f7',
    'info': '#11cdef',
    'success': '#2dce89',
    'danger': '#f5365c',
    'warning': '#fb6340'
  },
  black: '#12263F',
  white: '#FFFFFF',
  transparent: 'transparent',
};

export function chartOptions() {
  // Chart.js 4.x uses different configuration structure
  // Global defaults are now set using Chart.defaults

  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.color = (mode == 'dark') ? colors.gray[700] : colors.gray[600];
  Chart.defaults.font.family = fonts.base;
  Chart.defaults.font.size = 13;

  Chart.defaults.elements.point.radius = 0;
  Chart.defaults.elements.point.backgroundColor = colors.theme['primary'];
  Chart.defaults.elements.line.tension = 0.4;
  Chart.defaults.elements.line.borderWidth = 4;
  Chart.defaults.elements.line.borderColor = colors.theme['primary'];
  Chart.defaults.elements.line.backgroundColor = colors.transparent;
  Chart.defaults.elements.bar.backgroundColor = colors.theme['warning'];
  Chart.defaults.elements.arc.backgroundColor = colors.theme['primary'];
  Chart.defaults.elements.arc.borderColor = (mode == 'dark') ? colors.gray[800] : colors.white;
  Chart.defaults.elements.arc.borderWidth = 4;

  Chart.defaults.plugins.legend.display = false;
  Chart.defaults.plugins.legend.position = 'bottom';
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.padding = 16;

  Chart.defaults.plugins.tooltip.enabled = true;
  Chart.defaults.plugins.tooltip.mode = 'index';
  Chart.defaults.plugins.tooltip.intersect = false;

  // Scale defaults for linear scales
  Chart.defaults.scales.linear.grid.color = (mode == 'dark') ? colors.gray[900] : colors.gray[300];
  Chart.defaults.scales.linear.grid.display = (mode == 'dark') ? false : true;
  Chart.defaults.scales.linear.grid.lineWidth = 1;
  Chart.defaults.scales.linear.beginAtZero = true;
  Chart.defaults.scales.linear.ticks.padding = 10;

  // Scale defaults for category scales
  Chart.defaults.scales.category.grid.display = false;
  Chart.defaults.scales.category.ticks.padding = 20;

  return {
    // Return empty object as defaults are now set globally
  };
}

export const parseOptions = (parent, options) => {
		for (var item in options) {
			if (typeof options[item] !== 'object') {
				parent[item] = options[item];
			} else {
				parseOptions(parent[item], options[item]);
			}
		}
	}

export const chartExample1 = {
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    scales: {
      y: {
        grid: {
          color: colors.gray[900],
          drawOnChartArea: false
        },
        ticks: {
          callback: function(value) {
            if (!(value % 10)) {
              return '$' + value + 'k';
            }
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 5
      }
    }
  },
  data: {
    labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Performance',
      data: [0, 20, 10, 30, 15, 40, 20, 60, 60],
      borderColor: colors.theme['primary'],
      backgroundColor: colors.theme['primary'] + '20',
      tension: 0.4,
      borderWidth: 4,
      fill: true
    }]
  }
}

export const chartExample2 = {
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          borderDash: [2],
          color: colors.gray[300],
        },
        ticks: {
          callback: function(value) {
            if (!(value % 10)) {
              //return '$' + value + 'k'
              return value;
            }
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            var label = context.dataset.label || "";
            var yLabel = context.parsed.y;
            var content = "";
            if (context.chart.data.datasets.length > 1) {
              content += label + ': ';
            }
            content += yLabel;
            return content;
          }
        }
      },
      legend: {
        display: false
      },
    }
  },
  data: {
    labels: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Sales",
        data: [25, 20, 30, 22, 17, 29],
        maxBarThickness: 10,
        backgroundColor: colors.theme['warning'],
        borderRadius: 6,
        borderSkipped: false
      }
    ]
  }
}
