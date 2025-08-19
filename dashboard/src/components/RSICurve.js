import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useBacktest } from '../context/BacktestContext';
import './RSICurve.css'; 

export default function RSICurve() {
    const { backtestData } = useBacktest();
    const svgRef = useRef();

    useEffect(() => {
        if (!backtestData?.technical_indicators) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous chart

        const rsiData = backtestData["technical_indicators"]["RSI"] || [];
        const overboughtThreshold = backtestData["technical_indicators"]["Overbought_Threshold"] || 70;
        const oversoldThreshold = backtestData["technical_indicators"]["Oversold_Threshold"] || 30;
        const tradeLogData = backtestData["trade_log_data"] || [];

        // Set dimensions and margins
        const margin = { top: 20, right: 60, bottom: 60, left: 60 };
        const width = 950 - margin.left - margin.right;
        const height = 300 - margin.bottom - margin.top;

        // Create main group
        const g = svg
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Parse dates and prepare data
        const parseTime = d3.timeParse('%Y-%m-%d %H:%M:%S');
        const data = rsiData.map(d => ({
            date: parseTime(d.Date),
            rsi: +d.RSI_Value
        })).filter(d => d.date && !isNaN(d.rsi));

        // Parse trade log data
        const tradeData = tradeLogData.map(d => ({
            date: parseTime(d.timestamp),
            type: d.type
        })).filter(d => d.date);

        if (data.length === 0) return;

        // Set scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0]);

        // Create line generator
        const line = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.rsi))
            .curve(d3.curveMonotoneX);

        // Add gradient for RSI area
        const gradient = g.append('defs')
            .append('linearGradient')
            .attr('id', 'rsi-gradient')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', 0).attr('y1', height)
            .attr('x2', 0).attr('y2', 0);

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#3b82f6')
            .attr('stop-opacity', 0.1);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#3b82f6')
            .attr('stop-opacity', 0.3);

        // Add background grid
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d3.timeFormat("%m/%d/%y"))
            .ticks(6);

        const yAxis = d3.axisLeft(yScale)
            .ticks(5);

        // Add grid lines
        g.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .tickSize(-height)
                .tickFormat('')
                .ticks(6)
            )
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.3)
            .style('color', '#666');

        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yScale)
                .tickSize(-width)
                .tickFormat('')
                .ticks(5)
            )
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.3)
            .style('color', '#666');

        // Add threshold zones
        // Overbought zone (above 70)
        g.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', width)
            .attr('height', yScale(overboughtThreshold))
            .attr('fill', '#ef4444')
            .attr('opacity', 0)
            .transition()
            .duration(1000)
            .delay(500)
            .attr('opacity', 0.1);

        // Oversold zone (below 30)
        g.append('rect')
            .attr('x', 0)
            .attr('y', yScale(oversoldThreshold))
            .attr('width', width)
            .attr('height', height - yScale(oversoldThreshold))
            .attr('fill', '#10b981')
            .attr('opacity', 0)
            .transition()
            .duration(1000)
            .delay(500)
            .attr('opacity', 0.1);

        // Add threshold lines
        // Overbought line
        g.append('line')
            .attr('x1', 0)
            .attr('y1', yScale(overboughtThreshold))
            .attr('x2', 0)
            .attr('y2', yScale(overboughtThreshold))
            .attr('stroke', '#ef4444')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .transition()
            .duration(1500)
            .delay(300)
            .attr('x2', width);

        // Oversold line
        g.append('line')
            .attr('x1', 0)
            .attr('y1', yScale(oversoldThreshold))
            .attr('x2', 0)
            .attr('y2', yScale(oversoldThreshold))
            .attr('stroke', '#10b981')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .transition()
            .duration(1500)
            .delay(300)
            .attr('x2', width);

        // Add 50 midline
        g.append('line')
            .attr('x1', 0)
            .attr('y1', yScale(50))
            .attr('x2', 0)
            .attr('y2', yScale(50))
            .attr('stroke', '#6b7280')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '2,2')
            .attr('opacity', 0.5)
            .transition()
            .duration(1500)
            .delay(200)
            .attr('x2', width);

        // Add area under the curve
        const area = d3.area()
            .x(d => xScale(d.date))
            .y0(height)
            .y1(d => yScale(d.rsi))
            .curve(d3.curveMonotoneX);

        const areaPath = g.append('path')
            .datum(data)
            .attr('fill', 'url(#rsi-gradient)')
            .attr('d', area)
            .attr('opacity', 0);

        // Add main RSI line
        const path = g.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', '#3b82f6')
            .attr('stroke-width', 2.5)
            .attr('d', line);

        // Animate the line drawing
        const totalLength = path.node().getTotalLength();
        
        path
            .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
            .attr('stroke-dashoffset', totalLength)
            .transition()
            .duration(2000)
            .delay(800)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', 0)
            .on('end', () => {
                // Fade in the area after line animation
                areaPath.transition()
                    .duration(800)
                    .attr('opacity', 1);
            });

        // Add axes
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis)
            .style('color', '#9ca3af')
            .attr('opacity', 0)
            .transition()
            .duration(800)
            .delay(200)
            .attr('opacity', 1);

        g.append('g')
            .call(yAxis)
            .style('color', '#9ca3af')
            .attr('opacity', 0)
            .transition()
            .duration(800)
            .delay(200)
            .attr('opacity', 1);

        // Add axis labels
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('fill', '#9ca3af')
            .style('font-size', '12px')
            .style('font-family', 'Montserrat, sans-serif')
            .text('RSI Value')
            .attr('opacity', 0)
            .transition()
            .duration(800)
            .delay(1000)
            .attr('opacity', 1);

        g.append('text')
            .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
            .style('text-anchor', 'middle')
            .style('fill', '#9ca3af')
            .style('font-size', '12px')
            .style('font-family', 'Montserrat, sans-serif')
            .text('Date')
            .attr('opacity', 0)
            .transition()
            .duration(800)
            .delay(1000)
            .attr('opacity', 1);

        // Add chart title
        svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', 20)
            .style('text-anchor', 'middle')
            .style('fill', '#ffffff')
            .style('font-size', '18px')
            .style('font-weight', '300')
            .style('font-family', 'Montserrat, sans-serif')
            .text('RSI Technical Indicator')
            .attr('opacity', 0)
            .transition()
            .duration(800)
            .delay(500)
            .attr('opacity', 1);

        // Add threshold labels
        g.append('text')
            .attr('x', width - 5)
            .attr('y', yScale(overboughtThreshold) - 5)
            .attr('text-anchor', 'end')
            .style('fill', '#ef4444')
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .text(`Overbought (${overboughtThreshold})`)
            .attr('opacity', 0)
            .transition()
            .duration(800)
            .delay(1800)
            .attr('opacity', 1);

        g.append('text')
            .attr('x', width - 5)
            .attr('y', yScale(oversoldThreshold) + 15)
            .attr('text-anchor', 'end')
            .style('fill', '#10b981')
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .text(`Oversold (${oversoldThreshold})`)
            .attr('opacity', 0)
            .transition()
            .duration(800)
            .delay(1800)
            .attr('opacity', 1);

        // Add dots for data points (sample every nth point for performance)
        const sampleData = data.filter((d, i) => i % Math.ceil(data.length / 50) === 0);
        
        g.selectAll('.rsi-dot')
            .data(sampleData)
            .enter().append('circle')
            .attr('class', 'rsi-dot')
            .attr('cx', d => xScale(d.date))
            .attr('cy', d => yScale(d.rsi))
            .attr('r', 0)
            .attr('fill', d => {
                if (d.rsi > overboughtThreshold) return '#ef4444';
                if (d.rsi < oversoldThreshold) return '#10b981';
                return '#3b82f6';
            })
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .transition()
            .duration(300)
            .delay((d, i) => 2500 + (i * 20))
            .attr('r', 3)
            .attr('opacity', 0.8);

        // Add trade markers
        const tradesWithRSI = tradeData.map(trade => {
            // Find the closest RSI value for this trade date
            const closestRSI = data.reduce((prev, curr) => {
                return (Math.abs(curr.date - trade.date) < Math.abs(prev.date - trade.date) ? curr : prev);
            });
            return {
                ...trade,
                rsi: closestRSI ? closestRSI.rsi : 50 // fallback to midline if no RSI data
            };
        }).filter(d => xScale(d.date) >= 0 && xScale(d.date) <= width); // Only show trades within chart bounds

        // Add trade markers
        g.selectAll('.trade-marker')
            .data(tradesWithRSI)
            .enter().append('g')
            .attr('class', 'trade-marker')
            .attr('transform', d => `translate(${xScale(d.date)}, ${yScale(d.rsi)})`)
            .style('cursor', 'pointer')
            .each(function(d) {
                const marker = d3.select(this);
                
                if (d.type === 'BUY') {
                    // BUY marker - triangle pointing up
                    marker.append('polygon')
                        .attr('points', '0,-8 -6,4 6,4')
                        .attr('fill', '#10b981')
                        .attr('stroke', 'white')
                        .attr('stroke-width', 2);
                } else if (d.type === 'SELL') {
                    // SELL marker - triangle pointing down
                    marker.append('polygon')
                        .attr('points', '0,8 -6,-4 6,-4')
                        .attr('fill', '#ef4444')
                        .attr('stroke', 'white')
                        .attr('stroke-width', 2);
                }
                
                // Add label
                marker.append('text')
                    .attr('x', 0)
                    .attr('y', d.type === 'BUY' ? -12 : 18)
                    .attr('text-anchor', 'middle')
                    .style('fill', d.type === 'BUY' ? '#10b981' : '#ef4444')
                    .style('font-size', '10px')
                    .style('font-weight', 'bold')
                    .text(d.type);
            })
            .attr('opacity', 0)
            .transition()
            .duration(500)
            .delay(3000)
            .attr('opacity', 1);

        // Create tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "rsi-tooltip")
            .style("position", "absolute")
            .style("background", "rgba(10, 10, 20, 0.95)")
            .style("color", "#ffffff")
            .style("padding", "12px")
            .style("border-radius", "8px")
            .style("border", "1px solid #3b82f6")
            .style("font-family", "Montserrat, sans-serif")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("backdrop-filter", "blur(10px)")
            .style("box-shadow", "0 4px 20px rgba(0, 0, 0, 0.5)")
            .style("z-index", "1000");

        // Add tooltip interactions to trade markers
        g.selectAll('.trade-marker')
            .on('mouseover', function(event, d) {
                // Highlight the marker
                d3.select(this).select('polygon')
                    .transition()
                    .duration(200)
                    .style('transform', 'scale(1.2)');
                
                // Show tooltip
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 1);
                
                tooltip.html(`
                    <div style="margin-bottom: 8px;">
                        <strong style="color: ${d.type === 'BUY' ? '#10b981' : '#ef4444'};">${d.type} Signal</strong>
                    </div>
                    <div style="margin-bottom: 4px;">
                        <span style="color: #a0a0a0;">Date:</span> 
                        <span style="color: #ffffff;">${d.date.toLocaleDateString()}</span>
                    </div>
                    <div style="margin-bottom: 4px;">
                        <span style="color: #a0a0a0;">RSI Value:</span> 
                        <span style="color: #3b82f6;">${d.rsi.toFixed(2)}</span>
                    </div>
                    <div>
                        <span style="color: #a0a0a0;">Signal Type:</span> 
                        <span style="color: ${d.rsi > overboughtThreshold ? '#ef4444' : d.rsi < oversoldThreshold ? '#10b981' : '#6b7280'};">
                            ${d.rsi > overboughtThreshold ? 'Overbought' : d.rsi < oversoldThreshold ? 'Oversold' : 'Neutral'}
                        </span>
                    </div>
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mousemove', function(event, d) {
                tooltip
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function(event, d) {
                // Reset marker size
                d3.select(this).select('polygon')
                    .transition()
                    .duration(200)
                    .style('transform', 'scale(1)');
                
                // Hide tooltip
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0);
            });

        // Cleanup function
        return () => {
            // Clean up tooltip
            d3.select("body").selectAll(".rsi-tooltip").remove();
        };

    }, [backtestData]);

    return (
        <div className="rsi-curve-container">
            <svg ref={svgRef}></svg>
        </div>
    );
}