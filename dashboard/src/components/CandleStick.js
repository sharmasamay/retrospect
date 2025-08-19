import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useBacktest } from '../context/BacktestContext';
import './Candlestick.css';

const CandleStick = () => {
  const svgRef = useRef(null);
  const { backtestData, isLoading } = useBacktest();

  useEffect(() => {
    if (!backtestData?.ohcl_data || !svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Set up dimensions and margins
    const margin = { top: 50, right: 50, bottom: 80, left: 120 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create SVG with gradient background
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    // Add gradient definitions
    const defs = svg.append("defs");
    
    // Background gradient
    const bgGradient = defs.append("linearGradient")
      .attr("id", "bgGradient")
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

    // Candle gradients
    const bullishGradient = defs.append("linearGradient")
      .attr("id", "bullishGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    bullishGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#4ecdc4")
      .attr("stop-opacity", 1);
    
    bullishGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#26a69a")
      .attr("stop-opacity", 1);

    const bearishGradient = defs.append("linearGradient")
      .attr("id", "bearishGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    bearishGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#ff6b6b")
      .attr("stop-opacity", 1);
    
    bearishGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#ef5350")
      .attr("stop-opacity", 1);

    // Add background rectangle
    svg.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "url(#bgGradient)")
      .attr("rx", 12)
      .attr("ry", 12);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse and prepare data
    const data = backtestData.ohcl_data.map(d => ({
      date: new Date(d.Date || d.date),
      open: parseFloat(d.Open || d.open),
      high: parseFloat(d.High || d.high),
      low: parseFloat(d.Low || d.low),
      close: parseFloat(d.Close || d.close)
    })).sort((a, b) => a.date - b.date);

    // Set up scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(data, d => d.low) * 0.98,
        d3.max(data, d => d.high) * 1.02
      ])
      .range([height, 0]);

    // Calculate candle width based on data density
    const candleWidth = Math.min(
      (width / data.length) * 0.7,
      15
    );

    // Create axes with custom styling
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

    // Add axes to chart
    const xAxisGroup = g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis);

    const yAxisGroup = g.append("g")
      .attr("class", "y-axis")
      .call(yAxis);

    // Style axes text
    xAxisGroup.selectAll("text")
      .style("fill", "#a0a0a0")
      .style("font-family", "Montserrat, sans-serif")
      .style("font-size", "11px")
      .style("font-weight", "300")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    yAxisGroup.selectAll("text")
      .style("fill", "#a0a0a0")
      .style("font-family", "Montserrat, sans-serif")
      .style("font-size", "11px")
      .style("font-weight", "300");

    // Add axis labels with glow effect
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
      .style("filter", "drop-shadow(0 0 3px rgba(78, 205, 196, 0.3))")
      .text("Price ($)");

    g.append("text")
      .attr("class", "axis-label")
      .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
      .style("text-anchor", "middle")
      .style("fill", "#4ecdc4")
      .style("font-family", "Montserrat, sans-serif")
      .style("font-size", "12px")
      .style("font-weight", "300")
      .style("filter", "drop-shadow(0 0 3px rgba(78, 205, 196, 0.3))")
      .text("Date");

    // Create enhanced tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "d3-tooltip enhanced-tooltip")
      .style("opacity", 0);

    // Add candlesticks with animations
    const candlesticks = g.selectAll(".candlestick")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "candlestick")
      .style("opacity", 0);

    // Add high-low lines (wicks) with animation
    const wicks = candlesticks.append("line")
      .attr("class", "wick")
      .attr("x1", d => xScale(d.date))
      .attr("x2", d => xScale(d.date))
      .attr("y1", height)
      .attr("y2", height)
      .attr("stroke", d => d.close > d.open ? "#4ecdc4" : "#ff6b6b")
      .attr("stroke-width", 1.5)
      .style("filter", "drop-shadow(0 0 2px rgba(255,255,255,0.3))");

    // Add candle bodies with animation
    const bodies = candlesticks.append("rect")
      .attr("class", "candle-body")
      .attr("x", d => xScale(d.date) - candleWidth / 2)
      .attr("y", height)
      .attr("width", candleWidth)
      .attr("height", 0)
      .attr("fill", d => d.close > d.open ? "url(#bullishGradient)" : "url(#bearishGradient)")
      .attr("stroke", d => d.close > d.open ? "#4ecdc4" : "#ff6b6b")
      .attr("stroke-width", 1)
      .attr("rx", 2)
      .attr("ry", 2)
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))");

    // Animate candlesticks appearing
    candlesticks
      .transition()
      .duration(800)
      .delay((d, i) => i * 20)
      .style("opacity", 1);

    // Animate wicks
    wicks
      .transition()
      .duration(800)
      .delay((d, i) => i * 20)
      .attr("y1", d => yScale(d.high))
      .attr("y2", d => yScale(d.low));

    // Animate bodies
    bodies
      .transition()
      .duration(800)
      .delay((d, i) => i * 20)
      .attr("y", d => yScale(Math.max(d.open, d.close)))
      .attr("height", d => Math.abs(yScale(d.open) - yScale(d.close)) || 1);

    // Enhanced mouse events
    candlesticks
      .on("mouseover", function(event, d) {
        // Highlight effect
        d3.select(this)
          .transition()
          .duration(200)
          .style("filter", "brightness(1.2)");

        d3.select(this).select(".candle-body")
          .transition()
          .duration(200)
          .attr("stroke-width", 2)
          .style("filter", "drop-shadow(0 0 8px rgba(78, 205, 196, 0.8))");

        // Show tooltip
        tooltip.transition()
          .duration(200)
          .style("opacity", 1);
        
        const change = d.close - d.open;
        const changePercent = (change / d.open) * 100;
        
        tooltip.html(`
          <div class="tooltip-header">
            <strong>${d3.timeFormat("%B %d, %Y")(d.date)}</strong>
          </div>
          <div class="tooltip-content">
            <div class="ohlc-row">
              <span class="label">Open:</span> 
              <span class="value">$${d.open.toFixed(2)}</span>
            </div>
            <div class="ohlc-row">
              <span class="label">High:</span> 
              <span class="value high">$${d.high.toFixed(2)}</span>
            </div>
            <div class="ohlc-row">
              <span class="label">Low:</span> 
              <span class="value low">$${d.low.toFixed(2)}</span>
            </div>
            <div class="ohlc-row">
              <span class="label">Close:</span> 
              <span class="value">$${d.close.toFixed(2)}</span>
            </div>
            <div class="change-row ${change >= 0 ? 'positive' : 'negative'}">
              <span class="label">Change:</span>
              <span class="value">${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${changePercent.toFixed(2)}%)</span>
            </div>
          </div>
        `)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 15) + "px");
      })
      .on("mouseout", function(d) {
        // Remove highlight
        d3.select(this)
          .transition()
          .duration(200)
          .style("filter", "brightness(1)");

        d3.select(this).select(".candle-body")
          .transition()
          .duration(200)
          .attr("stroke-width", 1)
          .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))");

        tooltip.transition()
          .duration(300)
          .style("opacity", 0);
      });

    // Add animated chart title with glow
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
      .text("Price History")
      .transition()
      .duration(1000)
      .delay(500)
      .style("opacity", 1);

    // Add volume indicator (if available)
    if (data[0].volume) {
      // Add volume bars at the bottom
      const volumeHeight = 50;
      const volumeScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.volume)])
        .range([0, volumeHeight]);

      g.selectAll(".volume-bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "volume-bar")
        .attr("x", d => xScale(d.date) - candleWidth / 2)
        .attr("y", height + 20)
        .attr("width", candleWidth)
        .attr("height", 0)
        .attr("fill", d => d.close > d.open ? "rgba(78, 205, 196, 0.3)" : "rgba(255, 107, 107, 0.3)")
        .transition()
        .duration(800)
        .delay((d, i) => i * 20)
        .attr("height", d => volumeScale(d.volume || 0));
    }

    // Cleanup function
    return () => {
      d3.select("body").selectAll(".d3-tooltip").remove();
    };

  }, [backtestData]);

  if (isLoading) {
    return (
      <div className="candlestick-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Loading chart...</span>
        </div>
      </div>
    );
  }

  if (!backtestData?.ohcl_data || backtestData.ohcl_data.length === 0) {
    return (
      <div className="candlestick-container">
        <div className="no-data">
          <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: '300', fontSize: '16px' }}>No OHLC Data Available</h3>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: '300', fontSize: '14px' }}>Run a backtest to see the candlestick chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="candlestick-container">
      <div className="chart-wrapper">
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default CandleStick;