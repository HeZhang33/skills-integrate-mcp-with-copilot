// Statistics Dashboard JavaScript
let participationChart, ratesChart, capacityChart;

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
});

async function loadDashboard() {
  try {
    showLoading();
    
    // Fetch all statistics data
    const [overview, popular, participation, trends] = await Promise.all([
      fetch("/statistics").then(r => r.json()),
      fetch("/statistics/popular").then(r => r.json()),
      fetch("/statistics/participation").then(r => r.json()),
      fetch("/statistics/trends").then(r => r.json())
    ]);

    hideLoading();
    
    // Update overview cards
    updateOverviewCards(overview.overview);
    
    // Create charts
    createParticipationChart(popular.popular_activities);
    createRatesChart(participation.participation_analysis);
    createCapacityChart(trends.trends.capacity_utilization);
    
    // Update recommendations
    updateRecommendations(trends.trends);
    
    showDashboard();
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    hideLoading();
    showError();
  }
}

function updateOverviewCards(overview) {
  document.getElementById('total-activities').textContent = overview.total_activities;
  document.getElementById('total-participants').textContent = overview.total_participants;
  document.getElementById('total-capacity').textContent = overview.total_capacity;
  document.getElementById('average-rate').textContent = overview.average_participation_rate + '%';
}

function createParticipationChart(activities) {
  const ctx = document.getElementById('participationChart').getContext('2d');
  
  if (participationChart) {
    participationChart.destroy();
  }
  
  const labels = activities.map(a => a.name);
  const data = activities.map(a => a.participants);
  
  participationChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#1a237e', '#303f9f', '#3f51b5', '#5c6bc0', 
          '#7986cb', '#9fa8da', '#c5cae9', '#e8eaf6',
          '#ff5722', '#ff7043'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const activity = activities[context.dataIndex];
              return `${context.label}: ${context.parsed} participants (${activity.participation_rate}%)`;
            }
          }
        }
      }
    }
  });
}

function createRatesChart(activities) {
  const ctx = document.getElementById('ratesChart').getContext('2d');
  
  if (ratesChart) {
    ratesChart.destroy();
  }
  
  const labels = activities.map(a => a.activity);
  const rates = activities.map(a => a.participation_rate);
  const colors = rates.map(rate => {
    if (rate >= 80) return '#4caf50';  // Green for high
    if (rate >= 50) return '#ff9800';  // Orange for medium
    return '#f44336';  // Red for low
  });
  
  ratesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Participation Rate (%)',
        data: rates,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const activity = activities[context.dataIndex];
              return [
                `Participation Rate: ${context.parsed.y}%`,
                `Participants: ${activity.participants}/${activity.max_participants}`,
                `Level: ${activity.level.toUpperCase()}`
              ];
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
}

function createCapacityChart(capacityData) {
  const ctx = document.getElementById('capacityChart').getContext('2d');
  
  if (capacityChart) {
    capacityChart.destroy();
  }
  
  const labels = Object.keys(capacityData);
  const utilization = Object.values(capacityData);
  const remaining = utilization.map(u => 100 - u);
  
  capacityChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Used Capacity (%)',
          data: utilization,
          backgroundColor: '#1a237e',
          stack: 'capacity'
        },
        {
          label: 'Available Capacity (%)',
          data: remaining,
          backgroundColor: '#e0e0e0',
          stack: 'capacity'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          stacked: true,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        },
        x: {
          stacked: true,
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
}

function updateRecommendations(trends) {
  const container = document.getElementById('recommendations-list');
  container.innerHTML = '';
  
  // Add insights
  if (trends.insights && trends.insights.length > 0) {
    const insightsDiv = document.createElement('div');
    insightsDiv.innerHTML = '<h4>📈 Key Insights</h4>';
    trends.insights.forEach(insight => {
      const item = document.createElement('div');
      item.className = 'recommendation-item';
      item.innerHTML = `<strong>💡 ${insight}</strong>`;
      insightsDiv.appendChild(item);
    });
    container.appendChild(insightsDiv);
  }
  
  // Add recommendations
  if (trends.recommendations && trends.recommendations.length > 0) {
    const recsDiv = document.createElement('div');
    recsDiv.innerHTML = '<h4 style="margin-top: 20px;">🎯 Recommendations</h4>';
    trends.recommendations.forEach(rec => {
      const item = document.createElement('div');
      item.className = 'recommendation-item';
      
      let icon = '📋';
      if (rec.type === 'increase_capacity') icon = '📈';
      if (rec.type === 'promote_activities') icon = '📢';
      
      item.innerHTML = `<strong>${icon} ${rec.message}</strong>`;
      recsDiv.appendChild(item);
    });
    container.appendChild(recsDiv);
  }
  
  if (container.children.length === 0) {
    container.innerHTML = '<div class="recommendation-item">No specific recommendations at this time. All activities are performing well!</div>';
  }
}

function showLoading() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('error-message').style.display = 'none';
  document.getElementById('dashboard-content').style.display = 'none';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function showError() {
  document.getElementById('error-message').style.display = 'block';
  document.getElementById('dashboard-content').style.display = 'none';
}

function showDashboard() {
  document.getElementById('dashboard-content').style.display = 'block';
  document.getElementById('error-message').style.display = 'none';
}

function refreshDashboard() {
  loadDashboard();
}

// Export for debugging
window.dashboardDebug = {
  loadDashboard,
  refreshDashboard
};