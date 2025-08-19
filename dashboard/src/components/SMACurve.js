import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useBacktest } from '../context/BacktestContext';

const SMACurve = () => {
  const svgRef = useRef(null);
  const { backtestData, isLoading } = useBacktest();

  useEffect(() => {
    if (!backtestData?.technical_indicators?.SMA_Crossover || !svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Set up dimensions and margins
    const margin = { top: 50, right: 50, bottom: 80, left: 120 };
    const width = 950 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG with gradient background
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    // Add gradient definitions
    const defs = svg.append("defs");
    
    // Background gradient
    const bgGradient = defs.append("linearGradient")
      .attr("id", "smaBgGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    bgGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#0a0a14")
      .attr("stop-opacity", 1);
    
    bgGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#0d0d1a")
      .attr("stop-opacity", 1);

    // SMA line gradients
    const shortSmaGradient = defs.append("linearGradient")
      .attr("id", "shortSmaGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    
    shortSmaGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#4ecdc4")
      .attr("stop-opacity", 1);
    
    shortSmaGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#26a69a")
      .attr("stop-opacity", 1);

    const longSmaGradient = defs.append("linearGradient")
      .attr("id", "longSmaGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    
    longSmaGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#ff6b6b")
      .attr("stop-opacity", 1);
    
    longSmaGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#ef5350")
      .attr("stop-opacity", 1);

    // Area gradients for fills
    const shortSmaAreaGradient = defs.append("linearGradient")
      .attr("id", "shortSmaAreaGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    shortSmaAreaGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#4ecdc4")
      .attr("stop-opacity", 0.3);
    
    shortSmaAreaGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#4ecdc4")
      .attr("stop-opacity", 0.05);

    const longSmaAreaGradient = defs.append("linearGradient")
      .attr("id", "longSmaAreaGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    longSmaAreaGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#ff6b6b")
      .attr("stop-opacity", 0.3);
    
    longSmaAreaGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#ff6b6b")
      .attr("stop-opacity", 0.05);

    // Add background rectangle
    svg.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "url(#smaBgGradient)")
      .attr("rx", 12)
      .attr("ry", 12);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse and prepare SMA data
    const smaData = backtestData.technical_indicators.SMA_Crossover.map(d => ({
      date: new Date(d.Date),
      shortSMA: parseFloat(d.Short_SMA),
      longSMA: parseFloat(d.Long_SMA)
    })).sort((a, b) => a.date - b.date);

    // Parse trade log data
    const parseTime = d3.timeParse('%Y-%m-%d %H:%M:%S');
    const tradeLogData = backtestData["trade_log_data"] || [];
    const tradeData = tradeLogData.map(d => ({
      date: parseTime(d.timestamp),
      type: d.type
    })).filter(d => d.date);

    // Set up scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(smaData, d => d.date))
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(smaData, d => Math.min(d.shortSMA, d.longSMA)) * 0.98,
        d3.max(smaData, d => Math.max(d.shortSMA, d.longSMA)) * 1.02
      ])
      .range([height, 0]);

    // Create line generators
    const shortSmaLine = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.shortSMA))
      .curve(d3.curveMonotoneX);

    const longSmaLine = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.longSMA))
      .curve(d3.curveMonotoneX);

    // Create area generators
    const shortSmaArea = d3.area()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.shortSMA))
      .curve(d3.curveMonotoneX);

    const longSmaArea = d3.area()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.longSMA))
      .curve(d3.curveMonotoneX);

    // Create axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.timeFormat("%m/%d/%y"))
      .tickSize(6)
      .tickPadding(10);

    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => `$${d.toFixed(2)}`)
      .tickSize(6)
      .tickPadding(10);

    // Add animated grid lines
    const gridLinesX = g.append("g")
      .attr("class", "grid grid-x")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat("")
      );

    const gridLinesY = g.append("g")
      .attr("class", "grid grid-y")
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat("")
      );

    // Animate grid lines
    gridLinesX.selectAll("line")
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 50)
      .style("opacity", 0.3);

    gridLinesY.selectAll("line")
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 50)
      .style("opacity", 0.3);

    // Add axes
    const xAxisGroup = g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis);

    const yAxisGroup = g.append("g")
      .attr("class", "y-axis")
      .call(yAxis);

    // Style axes
    xAxisGroup.selectAll("text")
      .style("fill", "#a0a0a0")
      .style("font-family", "Montserrat, sans-serif")
      .style("font-size", "12px")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    yAxisGroup.selectAll("text")
      .style("fill", "#a0a0a0")
      .style("font-family", "Montserrat, sans-serif")
      .style("font-size", "12px");

    // Add axis labels
    g.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 20)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("fill", "#4ecdc4")
      .style("font-family", "Montserrat, sans-serif")
      .style("font-size", "12px")
      .style("font-weight", "300")
      .style("filter", "drop-shadow(0 0 3px rgba(78, 205, 196, 0.5))")
      .text("SMA Value ($)");

    g.append("text")
      .attr("class", "axis-label")
      .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
      .style("text-anchor", "middle")
      .style("fill", "#4ecdc4")
      .style("font-family", "Montserrat, sans-serif")
      .style("font-size", "12px")
      .style("font-weight", "300")
      .style("filter", "drop-shadow(0 0 3px rgba(78, 205, 196, 0.5))")
      .text("Date");

    // Add area fills first (behind lines)
    const longSmaAreaPath = g.append("path")
      .datum(smaData)
      .attr("class", "long-sma-area")
      .attr("fill", "url(#longSmaAreaGradient)")
      .attr("d", longSmaArea)
      .style("opacity", 0);

    const shortSmaAreaPath = g.append("path")
      .datum(smaData)
      .attr("class", "short-sma-area")
      .attr("fill", "url(#shortSmaAreaGradient)")
      .attr("d", shortSmaArea)
      .style("opacity", 0);

    // Add SMA lines
    const longSmaPath = g.append("path")
      .datum(smaData)
      .attr("class", "long-sma-line")
      .attr("fill", "none")
      .attr("stroke", "url(#longSmaGradient)")
      .attr("stroke-width", 3)
      .style("filter", "drop-shadow(0 0 6px rgba(255, 107, 107, 0.6))")
      .attr("d", longSmaLine);

    const shortSmaPath = g.append("path")
      .datum(smaData)
      .attr("class", "short-sma-line")
      .attr("fill", "none")
      .attr("stroke", "url(#shortSmaGradient)")
      .attr("stroke-width", 3)
      .style("filter", "drop-shadow(0 0 6px rgba(78, 205, 196, 0.6))")
      .attr("d", shortSmaLine);

    // Animate lines
    const shortSmaLength = shortSmaPath.node().getTotalLength();
    const longSmaLength = longSmaPath.node().getTotalLength();

    shortSmaPath
      .attr("stroke-dasharray", shortSmaLength + " " + shortSmaLength)
      .attr("stroke-dashoffset", shortSmaLength)
      .transition()
      .duration(2000)
      .delay(500)
      .attr("stroke-dashoffset", 0);

    longSmaPath
      .attr("stroke-dasharray", longSmaLength + " " + longSmaLength)
      .attr("stroke-dashoffset", longSmaLength)
      .transition()
      .duration(2000)
      .delay(700)
      .attr("stroke-dashoffset", 0);

    // Animate area fills
    shortSmaAreaPath
      .transition()
      .duration(1500)
      .delay(1000)
      .style("opacity", 1);

    longSmaAreaPath
      .transition()
      .duration(1500)
      .delay(1200)
      .style("opacity", 1);

    // Add crossover points
    const crossovers = [];
    for (let i = 1; i < smaData.length; i++) {
      const prev = smaData[i - 1];
      const curr = smaData[i];
      
      if ((prev.shortSMA <= prev.longSMA && curr.shortSMA > curr.longSMA) ||
          (prev.shortSMA >= prev.longSMA && curr.shortSMA < curr.longSMA)) {
        crossovers.push({
          date: curr.date,
          value: (curr.shortSMA + curr.longSMA) / 2,
          type: curr.shortSMA > curr.longSMA ? 'bullish' : 'bearish'
        });
      }
    }

    // Add crossover markers
    const crossoverPoints = g.selectAll(".crossover-point")
      .data(crossovers)
      .enter()
      .append("circle")
      .attr("class", "crossover-point")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.value))
      .attr("r", 0)
      .attr("fill", d => d.type === 'bullish' ? "#4ecdc4" : "#ff6b6b")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .style("filter", d => `drop-shadow(0 0 8px ${d.type === 'bullish' ? 'rgba(78, 205, 196, 0.8)' : 'rgba(255, 107, 107, 0.8)'})`)
      .transition()
      .duration(500)
      .delay((d, i) => 2500 + i * 200)
      .attr("r", 6);

    // Add trade markers
    const tradesWithSMA = tradeData.map(trade => {
      // Find the closest SMA value for this trade date
      const closestSMA = smaData.reduce((prev, curr) => {
        return (Math.abs(curr.date - trade.date) < Math.abs(prev.date - trade.date) ? curr : prev);
      });
      return {
        ...trade,
        shortSMA: closestSMA ? closestSMA.shortSMA : 0,
        longSMA: closestSMA ? closestSMA.longSMA : 0,
        avgSMA: closestSMA ? (closestSMA.shortSMA + closestSMA.longSMA) / 2 : 0
      };
    }).filter(d => xScale(d.date) >= 0 && xScale(d.date) <= width);

    // Add trade markers
    g.selectAll('.trade-marker')
      .data(tradesWithSMA)
      .enter().append('g')
      .attr('class', 'trade-marker')
      .attr('transform', d => `translate(${xScale(d.date)}, ${yScale(d.avgSMA)})`)
      .style('cursor', 'pointer')
      .each(function(d) {
        const marker = d3.select(this);
        
        if (d.type === 'BUY') {
          // BUY marker - triangle pointing up
          marker.append('polygon')
            .attr('points', '0,-10 -8,5 8,5')
            .attr('fill', '#10b981')
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('filter', 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))');
        } else if (d.type === 'SELL') {
          // SELL marker - triangle pointing down
          marker.append('polygon')
            .attr('points', '0,10 -8,-5 8,-5')
            .attr('fill', '#ef4444')
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('filter', 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.8))');
        }
        
        // Add label
        marker.append('text')
          .attr('x', 0)
          .attr('y', d.type === 'BUY' ? -15 : 20)
          .attr('text-anchor', 'middle')
          .style('fill', d.type === 'BUY' ? '#10b981' : '#ef4444')
          .style('font-size', '11px')
          .style('font-weight', 'bold')
          .style('filter', d => `drop-shadow(0 0 3px ${d.type === 'BUY' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'})`)
          .text(d.type);
      })
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay(3000)
      .attr('opacity', 1);

    // Create tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "sma-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(10, 10, 20, 0.95)")
      .style("color", "#ffffff")
      .style("padding", "12px")
      .style("border-radius", "8px")
      .style("border", "1px solid #4ecdc4")
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
            <span style="color: #a0a0a0;">Short SMA:</span> 
            <span style="color: #4ecdc4;">$${d.shortSMA.toFixed(2)}</span>
          </div>
          <div>
            <span style="color: #a0a0a0;">Long SMA:</span> 
            <span style="color: #ff6b6b;">$${d.longSMA.toFixed(2)}</span>
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

    // Add chart title
    g.append("text")
      .attr("class", "chart-title")
      .attr("x", width / 2)
      .attr("y", 0 - (margin.top / 2))
      .attr("text-anchor", "middle")
      .style("font-family", "Montserrat, sans-serif")
      .style("font-size", "18px")
      .style("font-weight", "300")
      .style("fill", "#ffffff")
      .style("filter", "drop-shadow(0 0 8px rgba(78, 205, 196, 0.4))")
      .style("opacity", 0)
      .text("Moving Average Crossover Analysis")
      .transition()
      .duration(1000)
      .delay(500)
      .style("opacity", 1);

    // Add legend
    const legend = g.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width}, 10)`);

    // Short SMA legend item
    const shortSmaLegend = legend.append("g")
      .attr("class", "legend-item")
      .style("opacity", 0);

    shortSmaLegend.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 20)
      .attr("y2", 0)
      .attr("stroke", "#4ecdc4")
      .attr("stroke-width", 3)
      .style("filter", "drop-shadow(0 0 3px rgba(78, 205, 196, 0.6))");

    shortSmaLegend.append("text")
      .attr("x", 25)
      .attr("y", 0)
      .attr("dy", "0.35em")
      .style("fill", "#4ecdc4")
      .style("font-family", "Montserrat, sans-serif")
      .style("font-size", "11px")
      .style("font-weight", "400")
      .text("Short SMA");

    // Long SMA legend item
    const longSmaLegend = legend.append("g")
      .attr("class", "legend-item")
      .attr("transform", "translate(0, 20)")
      .style("opacity", 0);

    longSmaLegend.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 20)
      .attr("y2", 0)
      .attr("stroke", "#ff6b6b")
      .attr("stroke-width", 3)
      .style("filter", "drop-shadow(0 0 3px rgba(255, 107, 107, 0.6))");

    longSmaLegend.append("text")
      .attr("x", 25)
      .attr("y", 0)
      .attr("dy", "0.35em")
      .style("fill", "#ff6b6b")
      .style("font-family", "Montserrat, sans-serif")
      .style("font-size", "11px")
      .style("font-weight", "400")
      .text("Long SMA");

    // Animate legend
    shortSmaLegend
      .transition()
      .duration(800)
      .delay(2800)
      .style("opacity", 1);

    longSmaLegend
      .transition()
      .duration(800)
      .delay(3000)
      .style("opacity", 1);

    // Cleanup function
    return () => {
      // Clean up tooltip
      d3.select("body").selectAll(".sma-tooltip").remove();
    };

  }, [backtestData]);

  if (isLoading) {
    return (
      <div className="sma-curve-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Loading SMA data...</span>
        </div>
      </div>
    );
  }

  if (!backtestData?.technical_indicators?.SMA_Crossover || backtestData.technical_indicators.SMA_Crossover.length === 0) {
    return (
      <div className="sma-curve-container">
        <div className="no-data">
          <h3>No SMA Data Available</h3>
          <p>Run a backtest with SMA indicators to see the curves</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sma-curve-container">
      <div className="chart-wrapper">
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default SMACurve;
