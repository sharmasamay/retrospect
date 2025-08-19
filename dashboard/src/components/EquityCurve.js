/* filepath: /Users/samaysharma/Desktop/backshot/dashboard/src/components/EquityCurve.js */
import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { useBacktest } from '../context/BacktestContext';
import './EquityCurve.css'

const EquityCurve = () => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const { backtestData, isLoading } = useBacktest();
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });

  useEffect(() => {
    if (!backtestData?.equity_curve_data || !svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 950;
    const height = 400;
    const margin = { top: 40, right: 40, bottom: 60, left: 100 };

    svg.attr("width", width).attr("height", height);

    const equityData = backtestData.equity_curve_data.map(d => ({
      date: new Date(d.Date),
      value: +d.Value
    }));

    console.log('Equity data:', equityData);

    if (equityData.length === 0) return;

    // Create enhanced gradient definitions
    const defs = svg.append("defs");
    
    // Enhanced line gradient with multiple stops
    const lineGradient = defs.append("linearGradient")
      .attr("id", "line-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", 0)
      .attr("x2", width).attr("y2", 0);
    
    lineGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#00E676");
    
    lineGradient.append("stop")
      .attr("offset", "25%")
      .attr("stop-color", "#4CAF50");
    
    lineGradient.append("stop")
      .attr("offset", "50%")
      .attr("stop-color", "#66BB6A");
    
    lineGradient.append("stop")
      .attr("offset", "75%")
      .attr("stop-color", "#81C784");
    
    lineGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#A5D6A7");

    // Enhanced area gradient
    const areaGradient = defs.append("linearGradient")
      .attr("id", "area-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", 0)
      .attr("x2", 0).attr("y2", height);
    
    areaGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#00E676")
      .attr("stop-opacity", 0.4);
    
    areaGradient.append("stop")
      .attr("offset", "30%")
      .attr("stop-color", "#4CAF50")
      .attr("stop-opacity", 0.3);
    
    areaGradient.append("stop")
      .attr("offset", "70%")
      .attr("stop-color", "#4CAF50")
      .attr("stop-opacity", 0.1);
    
    areaGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#4CAF50")
      .attr("stop-opacity", 0.02);

    // Add glow filter
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter.append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode")
      .attr("in", "coloredBlur");
    feMerge.append("feMergeNode")
      .attr("in", "SourceGraphic");

    const x = d3.scaleTime()
      .domain(d3.extent(equityData, (d) => d.date))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([
        d3.min(equityData, (d) => d.value) * 0.95,
        d3.max(equityData, (d) => d.value) * 1.05,
      ])
      .range([height - margin.bottom, margin.top]);

    // Enhanced grid lines with smoother animations
    const xAxis = d3.axisBottom(x).ticks(8);
    const yAxis = d3.axisLeft(y).ticks(8);

    // X-axis grid with staggered animation
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x)
        .ticks(8)
        .tickSize(-(height - margin.top - margin.bottom))
        .tickFormat("")
      )
      .selectAll("line")
      .style("stroke", "#333")
      .style("stroke-dasharray", "2,4")
      .style("opacity", 0)
      .transition()
      .delay((d, i) => i * 100)
      .duration(800)
      .ease(d3.easeQuadOut)
      .style("opacity", 0.4);

    // Y-axis grid with staggered animation
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y)
        .ticks(8)
        .tickSize(-(width - margin.left - margin.right))
        .tickFormat("")
      )
      .selectAll("line")
      .style("stroke", "#333")
      .style("stroke-dasharray", "2,4")
      .style("opacity", 0)
      .transition()
      .delay((d, i) => i * 120)
      .duration(800)
      .ease(d3.easeQuadOut)
      .style("opacity", 0.4);

    // Enhanced axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .selectAll('text')
      .style('fill', '#b0b0b0')
      .style('font-size', '12px')
      .style('opacity', 0)
      .transition()
      .delay(1000)
      .duration(600)
      .style('opacity', 1);

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .selectAll('text')
      .style('fill', '#b0b0b0')
      .style('font-size', '12px')
      .style('opacity', 0)
      .transition()
      .delay(1000)
      .duration(600)
      .style('opacity', 1);

    // Add axis labels
    // X-axis label
    svg.append("text")
      .attr("transform", `translate(${width / 2}, ${height - 10})`)
      .style("text-anchor", "middle")
      .style("fill", "#b0b0b0")
      .style("font-size", "14px")
      .style("font-weight", "500")
      .style("font-family", "Montserrat, sans-serif")
      .style("opacity", 0)
      .text("Date")
      .transition()
      .delay(1200)
      .duration(600)
      .style("opacity", 1);

    // Y-axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 20)
      .attr("x", 0 - (height / 2))
      .style("text-anchor", "middle")
      .style("fill", "#b0b0b0")
      .style("font-size", "14px")
      .style("font-weight", "500")
      .style("font-family", "Montserrat, sans-serif")
      .style("opacity", 0)
      .text("Portfolio Value ($)")
      .transition()
      .delay(1200)
      .duration(600)
      .style("opacity", 1);

    // Add chart title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 25)
      .style("text-anchor", "middle")
      .style("fill", "#ffffff")
      .style("font-size", "18px")
      .style("font-weight", "300")
      .style("font-family", "Montserrat, sans-serif")
      .style("opacity", 0)
      .text("Portfolio Equity Curve")
      .transition()
      .delay(800)
      .duration(600)
      .style("opacity", 1);

    // Enhanced area and line with smoother curves
    const area = d3.area()
      .x((d) => x(d.date))
      .y0(height - margin.bottom)
      .y1((d) => y(d.value))
      .curve(d3.curveCardinal.tension(0.3));

    const line = d3.line()
      .x((d) => x(d.date))
      .y((d) => y(d.value))
      .curve(d3.curveCardinal.tension(0.3));

    // Add area fill with wave animation
    const areaPath = svg.append("path")
      .datum(equityData)
      .attr("fill", "url(#area-gradient)")
      .attr("d", area)
      .style("opacity", 0)
      .style("transform", "scaleY(0)")
      .style("transform-origin", "bottom");

    areaPath.transition()
      .duration(2500)
      .ease(d3.easeBackOut.overshoot(0.3))
      .style("opacity", 1)
      .style("transform", "scaleY(1)");

    // Add enhanced line with glow effect
    const path = svg.append("path")
      .datum(equityData)
      .attr("fill", "none")
      .attr("stroke", "url(#line-gradient)")
      .attr("stroke-width", 4)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("d", line)
      .style("filter", "url(#glow)")
      .style("opacity", 0.9);

    const totalLength = path.node().getTotalLength();
    
    path
      .attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(3000)
      .ease(d3.easeQuadInOut)
      .attr("stroke-dashoffset", 0)
      .on("end", () => {
        // Add pulsing glow effect after drawing
        path.style("animation", "glow-pulse 3s ease-in-out infinite");
      });

    // Add data points with delayed animation
    svg.selectAll(".data-point")
      .data(equityData.filter((d, i) => i % Math.max(1, Math.floor(equityData.length / 20)) === 0))
      .enter()
      .append("circle")
      .attr("class", "data-point")
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.value))
      .attr("r", 0)
      .style("fill", "#00E676")
      .style("stroke", "#fff")
      .style("stroke-width", 2)
      .style("opacity", 0)
      .transition()
      .delay((d, i) => 3000 + i * 50)
      .duration(400)
      .ease(d3.easeElasticOut)
      .attr("r", 3)
      .style("opacity", 0.8);

    // Add invisible overlay for mouse events
    const bisect = d3.bisector(d => d.date).left;
    
    const overlay = svg.append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .style("fill", "none")
      .style("pointer-events", "all");

    // Enhanced focus circle
    const focus = svg.append("g")
      .style("display", "none");

    focus.append("circle")
      .attr("r", 8)
      .style("fill", "#00E676")
      .style("stroke", "#fff")
      .style("stroke-width", 3)
      .style("filter", "drop-shadow(0 0 12px rgba(0, 230, 118, 0.8))")
      .style("opacity", 0.9);

    overlay
      .on("mouseover", () => {
        focus.style("display", null);
        setTooltip(prev => ({ ...prev, visible: true }));
      })
      .on("mouseout", () => {
        focus.style("display", "none");
        setTooltip(prev => ({ ...prev, visible: false }));
      })
      .on("mousemove", function(event) {
        const [mouseX] = d3.pointer(event);
        const x0 = x.invert(mouseX);
        const i = bisect(equityData, x0, 1);
        const d0 = equityData[i - 1];
        const d1 = equityData[i];
        const d = d1 && (x0 - d0.date > d1.date - x0) ? d1 : d0;
        
        if (d) {
          focus.attr("transform", `translate(${x(d.date)}, ${y(d.value)})`);
          
          const rect = svgRef.current.getBoundingClientRect();
          setTooltip({
            visible: true,
            x: rect.left + x(d.date) - 365,
            y: rect.top + y(d.value) - 255,
            data: d
          });
        }
      });

  }, [backtestData]);

  if (isLoading) {
    return (
      <div className="equity-curve-container">
        <div className="equity-curve-loading" style={{ height: '400px' }}>
          <div>Loading equity curve...</div>
        </div>
      </div>
    );
  }

  if (!backtestData?.equity_curve_data) {
    return (
      <div className="equity-curve-container">
        <div className="equity-curve-no-data" style={{ height: '400px' }}>
          <div className="equity-curve-no-data-content">
            <div>No equity curve data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="equity-curve-container">
      <svg ref={svgRef} className="equity-curve-svg"></svg>
      
      {tooltip.visible && tooltip.data && (
        <div 
          ref={tooltipRef}
          className="equity-curve-tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 1000
          }}
        >
          <div className="tooltip-date">
            {tooltip.data.date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </div>
          <div className="tooltip-value">
            ${tooltip.data.value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EquityCurve;