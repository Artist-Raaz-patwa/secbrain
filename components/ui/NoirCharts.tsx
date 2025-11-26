
import React, { useState } from 'react';

interface ChartDataPoint {
  label: string;
  value: number;
}

interface ChartProps {
  data: ChartDataPoint[];
  height?: number;
  className?: string;
  lineColor?: string;
  fill?: boolean;
  showDataLabels?: boolean;
}

export const NoirLineChart: React.FC<ChartProps> = ({ data, height = 200, className = '', lineColor = 'currentColor', fill = true, showDataLabels = false }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length < 2) return <div className="flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 h-full text-xs font-mono text-gray-400">INSUFFICIENT DATA</div>;

  const paddingLeft = 40; 
  const paddingRight = 20;
  const paddingTop = 30; // Increased top padding for labels
  const paddingBottom = 20;

  const width = 800; 
  const maxVal = Math.max(...data.map(d => d.value)) * 1.1;
  const minVal = Math.min(0, ...data.map(d => d.value));
  const range = maxVal - minVal || 1;

  const xScale = (i: number) => paddingLeft + (i / (data.length - 1)) * (width - paddingLeft - paddingRight);
  const yScale = (val: number) => height - paddingBottom - ((val - minVal) / range) * (height - paddingTop - paddingBottom);

  const pathD = data.map((pt, i) => 
      `${i===0 ? 'M' : 'L'} ${xScale(i)} ${yScale(pt.value)}`
  ).join(' ');

  const areaD = `${pathD} L ${width-paddingRight} ${height-paddingBottom} L ${paddingLeft} ${height-paddingBottom} Z`;

  return (
    <div className={`w-full relative ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={lineColor === 'currentColor' ? '#000' : lineColor} className="text-black dark:text-white" stopOpacity="0.1" />
                    <stop offset="100%" stopColor={lineColor === 'currentColor' ? '#000' : lineColor} className="text-black dark:text-white" stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Grid Lines & Labels */}
            <g className="text-gray-300 dark:text-gray-700 font-mono text-[10px]">
                {/* Max */}
                <line x1={paddingLeft} y1={yScale(maxVal * 0.9)} x2={width-paddingRight} y2={yScale(maxVal * 0.9)} stroke="currentColor" strokeWidth="1" strokeDasharray="4 4"/>
                <text x={paddingLeft - 5} y={yScale(maxVal * 0.9) + 4} textAnchor="end" fill="currentColor" className="fill-gray-400">{Math.round(maxVal * 0.9).toLocaleString()}</text>
                
                {/* Mid */}
                <line x1={paddingLeft} y1={yScale((maxVal+minVal)/2)} x2={width-paddingRight} y2={yScale((maxVal+minVal)/2)} stroke="currentColor" strokeWidth="1" strokeDasharray="4 4"/>
                <text x={paddingLeft - 5} y={yScale((maxVal+minVal)/2) + 4} textAnchor="end" fill="currentColor" className="fill-gray-400">{Math.round((maxVal+minVal)/2).toLocaleString()}</text>

                {/* Zero/Base */}
                <line x1={paddingLeft} y1={yScale(0)} x2={width-paddingRight} y2={yScale(0)} stroke="currentColor" strokeWidth="1" strokeDasharray="4 4"/>
                <text x={paddingLeft - 5} y={yScale(0) + 4} textAnchor="end" fill="currentColor" className="fill-gray-400">0</text>
            </g>

            {/* Fill Area */}
            {fill && <path d={areaD} fill="url(#chartGradient)" />}

            {/* Main Line */}
            <path d={pathD} fill="none" stroke={lineColor} strokeWidth="3" className={lineColor === 'currentColor' ? 'text-black dark:text-white' : ''} vectorEffect="non-scaling-stroke" />

            {/* Interactive Points & Data Labels */}
            {data.map((pt, i) => (
                <g 
                    key={i} 
                    className="group cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <circle cx={xScale(i)} cy={yScale(pt.value)} r="4" 
                        className={`fill-white dark:fill-black stroke-2 transition-transform duration-200 ${hoveredIndex === i ? 'scale-150' : ''} ${lineColor === 'currentColor' ? 'stroke-black dark:stroke-white' : ''}`}
                        style={{ stroke: lineColor !== 'currentColor' ? lineColor : undefined }}
                    />
                    
                    {/* Always Visible Labels if requested, or on hover */}
                    {(showDataLabels || hoveredIndex === i) && (
                         <text 
                            x={xScale(i)} 
                            y={yScale(pt.value) - 12} 
                            textAnchor="middle" 
                            className={`font-mono text-[10px] font-bold fill-black dark:fill-white transition-opacity ${hoveredIndex === i ? 'text-xs' : 'opacity-70'}`}
                         >
                            {pt.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                         </text>
                    )}

                    {/* Extended Tooltip on Hover */}
                    <foreignObject x={xScale(i) - 50} y={yScale(pt.value) - 50} width="100" height="40" className={`pointer-events-none transition-opacity duration-200 ${hoveredIndex === i ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="flex flex-col items-center justify-center pt-2">
                            <div className="bg-black text-white dark:bg-white dark:text-black text-[10px] font-mono px-2 py-1 shadow-lg font-bold rounded-sm whitespace-nowrap z-50">
                                {pt.label}: {pt.value.toLocaleString()}
                            </div>
                        </div>
                    </foreignObject>
                </g>
            ))}
        </svg>
    </div>
  );
};

export const NoirBarChart: React.FC<ChartProps> = ({ data, height = 200, className = '' }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (data.length === 0) return <div className="flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 h-full text-xs font-mono text-gray-400">NO DATA</div>;

    const padding = 20;
    const width = 800;
    const maxVal = Math.max(...data.map(d => d.value)) * 1.1;
    const barWidth = (width - padding * 2) / data.length * 0.6;
    
    // Scale Logic
    const yScale = (val: number) => (val / maxVal) * (height - padding * 2);

    return (
        <div className={`w-full relative ${className}`}>
             <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                {/* Baseline */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-black dark:text-white" strokeWidth="2" />

                {data.map((pt, i) => {
                    const x = padding + (i * ((width - padding * 2) / data.length)) + ((width - padding * 2) / data.length - barWidth)/2;
                    const barHeight = yScale(pt.value);
                    const y = height - padding - barHeight;

                    return (
                        <g 
                            key={i}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className="cursor-pointer"
                        >
                            <rect 
                                x={x} 
                                y={y} 
                                width={barWidth} 
                                height={barHeight} 
                                className={`fill-black dark:fill-white transition-opacity duration-200 ${hoveredIndex !== null && hoveredIndex !== i ? 'opacity-50' : 'opacity-100'}`}
                            />
                            
                            {/* Value Label */}
                            <text 
                                x={x + barWidth/2} 
                                y={y - 5} 
                                textAnchor="middle" 
                                className={`font-mono text-xs fill-black dark:fill-white font-bold`}
                            >
                                {pt.value.toLocaleString()}
                            </text>

                            {/* X Axis Label */}
                            <text 
                                x={x + barWidth/2} 
                                y={height - 5} 
                                textAnchor="middle" 
                                className="font-mono text-[10px] fill-gray-500 uppercase"
                            >
                                {pt.label}
                            </text>
                        </g>
                    );
                })}
             </svg>
        </div>
    );
};

export const NoirPieChart: React.FC<ChartProps> = ({ data, height = 300, className = '' }) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    let cumulativePercent = 0;

    if (total === 0) return <div className="flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 h-full text-xs font-mono text-gray-400">NO DATA</div>;

    return (
        <div className={`flex flex-col md:flex-row items-center justify-center gap-8 ${className}`}>
            <div className="relative" style={{ width: height, height: height }}>
                <svg viewBox="-105 -105 210 210" className="transform -rotate-90 w-full h-full">
                    {data.map((pt, i) => {
                        const percent = pt.value / total;
                        const startX = Math.cos(2 * Math.PI * cumulativePercent) * 100;
                        const startY = Math.sin(2 * Math.PI * cumulativePercent) * 100;
                        cumulativePercent += percent;
                        const endX = Math.cos(2 * Math.PI * cumulativePercent) * 100;
                        const endY = Math.sin(2 * Math.PI * cumulativePercent) * 100;

                        // Large arc flag
                        const largeArcFlag = percent > 0.5 ? 1 : 0;
                        const pathData = `M 0 0 L ${startX} ${startY} A 100 100 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
                        
                        // Colors (Noir Palette)
                        const fills = ['#111', '#444', '#888', '#CCC', '#FFF'];
                        
                        const fill = fills[i % fills.length];
                        
                        return (
                            <path 
                                key={i} 
                                d={pathData} 
                                fill={fill} 
                                stroke="#888" 
                                strokeWidth="0.5"
                                className="hover:scale-105 transition-transform origin-center cursor-pointer"
                            >
                                <title>{pt.label}: {Math.round(percent*100)}%</title>
                            </path>
                        );
                    })}
                </svg>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {data.map((pt, i) => {
                    const fills = ['#111', '#444', '#888', '#CCC', '#FFF'];
                    return (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-3 h-3 border border-gray-500" style={{ background: fills[i % fills.length] }}></div>
                            <div className="font-mono text-xs">
                                <span className="font-bold">{pt.label}</span>
                                <span className="text-gray-500 ml-2">({Math.round((pt.value/total)*100)}%)</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
