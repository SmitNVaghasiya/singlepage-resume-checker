import React from "react";

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  data: ChartData[];
  type: "bar" | "line" | "pie";
  title: string;
  height?: number;
}

const SimpleChart: React.FC<SimpleChartProps> = ({
  data,
  type,
  title,
  height = 200,
}) => {
  const maxValue = Math.max(...data.map((d) => d.value));
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  const renderBarChart = () => (
    <div className="chart-container" style={{ height }}>
      <div className="chart-bars">
        {data.map((item, index) => (
          <div key={index} className="chart-bar-group">
            <div
              className="chart-bar"
              style={{
                height: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color || "#3b82f6",
              }}
            />
            <div className="chart-label">{item.label}</div>
            <div className="chart-value">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLineChart = () => (
    <div className="chart-container" style={{ height }}>
      <svg width="100%" height="100%" className="chart-svg">
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          points={data
            .map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - (item.value / maxValue) * 100;
              return `${x},${y}`;
            })
            .join(" ")}
        />
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - (item.value / maxValue) * 100;
          return (
            <circle
              key={index}
              cx={`${x}%`}
              cy={`${y}%`}
              r="4"
              fill="#3b82f6"
            />
          );
        })}
      </svg>
    </div>
  );

  const renderPieChart = () => (
    <div className="chart-container" style={{ height }}>
      <svg width="100%" height="100%" className="chart-svg">
        {data.map((item, index) => {
          const percentage = (item.value / totalValue) * 100;
          const startAngle = data
            .slice(0, index)
            .reduce((sum, d) => sum + (d.value / totalValue) * 360, 0);
          const endAngle = startAngle + (item.value / totalValue) * 360;

          const radius = 40;
          const centerX = 50;
          const centerY = 50;

          const startRad = (startAngle - 90) * (Math.PI / 180);
          const endRad = (endAngle - 90) * (Math.PI / 180);

          const x1 = centerX + radius * Math.cos(startRad);
          const y1 = centerY + radius * Math.sin(startRad);
          const x2 = centerX + radius * Math.cos(endRad);
          const y2 = centerY + radius * Math.sin(endRad);

          const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            "Z",
          ].join(" ");

          return (
            <path
              key={index}
              d={pathData}
              fill={item.color || `hsl(${(index * 60) % 360}, 70%, 60%)`}
            />
          );
        })}
      </svg>
      <div className="chart-legend">
        {data.map((item, index) => (
          <div key={index} className="legend-item">
            <div
              className="legend-color"
              style={{
                backgroundColor:
                  item.color || `hsl(${(index * 60) % 360}, 70%, 60%)`,
              }}
            />
            <span>
              {item.label}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChart = () => {
    switch (type) {
      case "bar":
        return renderBarChart();
      case "line":
        return renderLineChart();
      case "pie":
        return renderPieChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <div className="simple-chart">
      <h3 className="chart-title">{title}</h3>
      {renderChart()}
    </div>
  );
};

export default SimpleChart;
