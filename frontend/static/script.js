const MAX_DATAPOINTS = 1440; // this is the max data points that cloudwatch limit

// this function will return the amount of datapoints based of the start and end input of the user 
function calculateDataPoints(start, end, interval) {
  const startTime = new Date(start);
  const endTime = new Date(end);

  const timeDiffInSeconds = (endTime - startTime) / 1000; // to get the time in seconds

  return Math.floor(timeDiffInSeconds / interval);
}

function adjustInterval(start, end, interval) {
  const dataPoints = calculateDataPoints(start, end, interval);
  start = new Date(start)
  end = new Date(end)
  
  console.log(dataPoints)
  console.log(start, end, interval)

  if (dataPoints > MAX_DATAPOINTS) {
    // if the data points exceed the limit, increase the interval
    const newInterval = Math.ceil(((end - start) / 1000) / MAX_DATAPOINTS);
    console.log(newInterval)
    return newInterval;
  }
  
  return interval;
}

// this function wll return a array full of hours -> from 6AM to 5AM 
function generateTimeLabels() {
  const labels = [];
  let time = 6; // start time: 6AM

  for (let i = 0; i < 24; i++) {
    const amPm = time >= 12 ? 'PM' : 'AM';
    const hour = time % 12 || 12;
    labels.push(`${hour}${amPm}`);
    time = (time + 1) % 24;
  }

  return labels;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('cpuForm');
  const chartCanvas = document.getElementById('cpuChart');
  const ctx = chartCanvas.getContext('2d'); // to draw the chart
  let cpuChart = null;

  form.addEventListener('submit', async (event) => {
    event.preventDefault(); // prevents the browser from reloading when user submit the form

    const ip = document.getElementById('ip').value;
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;
    const interval = document.getElementById('interval').value;

    const dataPoints = calculateDataPoints(start, end, interval);

    if (dataPoints > MAX_DATAPOINTS) {
      const userChoice = window.confirm(`The number of data points exceeds the limit of ${MAX_DATAPOINTS}. Would you like me to adjust the interval for you? Click "OK" to adjust, or "Cancel" to adjust manually.`);

      if (userChoice) {
        const adjustedInterval = adjustInterval(start, end, interval);
        const apiUrl = `/cpu-usage?ip=${ip}&start=${start}&end=${end}&interval=${adjustedInterval}`;
        
        // proceed with the request using the adjusted interval
        try {
          const response = await fetch(apiUrl);
          const data = await response.json();

          if (!response.ok) {
            alert(data['error'] || 'Failed to retrieve CPU data');
            return;
          }

          const usageValues = data.map(point => point.value);

          if (cpuChart) cpuChart.destroy();
     
          cpuChart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: generateTimeLabels(),
              datasets: [{
                label: 'Metric Data ',
                data: usageValues,
                borderColor: 'red',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Time',
                  },
                },
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Percentage (%)',
                  },
                }
              },
            }
          });
          
        } catch (error) {
          console.error('Error fetching or rendering data:', error);
          alert('An error occurred while loading the chart.');
        }
      }
    } else {
      // if the data points are within the limit, proceed normally
      const apiUrl = `/cpu-usage?ip=${ip}&start=${start}&end=${end}&interval=${interval}`;
      
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
          alert(data['error'] || 'Failed to retrieve CPU data');
          return;
        }

        const usageValues = data.map(point => point.value);

        if (cpuChart) cpuChart.destroy();
   
        cpuChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: generateTimeLabels(),
            datasets: [{
              label: 'Metric Data ',
              data: usageValues,
              borderColor: 'red',
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Time',
                },
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Percentage (%)',
                },
              }
            },
          }
        });

      } catch (error) {
        console.error('Error fetching or rendering data:', error);
        alert('An error occurred while loading the chart.');
      }
    }
  });
});
