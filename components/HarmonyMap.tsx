
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ChordNode, Connection } from '../types';
import { audioService } from '../services/audio';

interface HarmonyMapProps {
  nodes: ChordNode[];
  links: Connection[];
  onChordSelect: (chord: ChordNode | null) => void;
  selectedChordId: string | null;
}

const HarmonyMap: React.FC<HarmonyMapProps> = ({ 
  nodes, 
  links, 
  onChordSelect, 
  selectedChordId
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const isMobile = width < 768;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height]);

    svg.selectAll('*').remove();

    svg.on('click', (event) => {
      if (event.target === svgRef.current) {
        onChordSelect(null);
      }
    });

    // Markers
    const defs = svg.append('defs');
    
    defs.selectAll('marker')
      .data(['resolution', 'preparation', 'modulation', 'tritone_sub', 'backdoor', 'ai-path'])
      .join('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', isMobile ? 32 : 38)
      .attr('refY', 0)
      .attr('markerWidth', isMobile ? 4 : 6)
      .attr('markerHeight', isMobile ? 4 : 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', d => {
        if (d === 'ai-path') return '#facc15';
        if (d === 'tritone_sub') return '#ec4899';
        if (d === 'backdoor') return '#06b6d4';
        return d === 'resolution' ? '#60a5fa' : '#94a3b8';
      })
      .attr('d', 'M0,-5L10,0L0,5');

    // Glow filter
    defs.append('filter')
      .attr('id', 'glow')
      .append('feGaussianBlur')
      .attr('stdDeviation', '2.5')
      .attr('result', 'coloredBlur');

    const g = svg.append('g');

    // Clone data for d3 simulation
    const nodesCopy = nodes.map(d => ({ ...d }));
    const linksCopy = links.map(d => ({ ...d }));

    const simulation = d3.forceSimulation(nodesCopy as any)
      .force('link', d3.forceLink(linksCopy).id((d: any) => d.id).distance(isMobile ? 120 : 200))
      .force('charge', d3.forceManyBody().strength(isMobile ? -800 : -1500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(isMobile ? 70 : 110))
      .force('radial', d3.forceRadial((d: any) => d.isDiatonic ? 0 : (isMobile ? 220 : 400), width / 2, height / 2).strength(0.3));

    const link = g.append('g')
      .selectAll('path')
      .data(linksCopy)
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', (d: any) => {
        if (d.type === 'ai-path') return '#facc15';
        if (d.type === 'tritone_sub') return '#ec4899';
        if (d.type === 'backdoor') return '#06b6d4';
        return d.type === 'resolution' ? '#3b82f6' : '#475569';
      })
      .attr('stroke-width', (d: any) => d.type === 'ai-path' ? (isMobile ? 3 : 5) : Math.sqrt(d.strength) * (isMobile ? 1 : 1.5))
      .attr('stroke-opacity', (d: any) => d.type === 'ai-path' ? 0.9 : 0.5)
      .attr('stroke-dasharray', (d: any) => d.type === 'ai-path' ? '8,4' : 'none')
      .attr('marker-end', (d: any) => `url(#arrow-${d.type})`)
      .style('filter', (d: any) => d.type === 'ai-path' ? 'drop-shadow(0 0 4px #facc15)' : 'none');

    const node = g.append('g')
      .selectAll('g')
      .data(nodesCopy)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        onChordSelect(d as any);
        audioService.playChord(d.notes);
      });

    const nodeRadius = isMobile ? 32 : 42;
    const innerRadius = isMobile ? 26 : 34;

    // Outer circle (aura)
    node.append('circle')
      .attr('r', d => (d as any).isAI ? nodeRadius + 4 : nodeRadius)
      .attr('fill', d => d.color)
      .attr('fill-opacity', 0.1)
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', d => d.isDiatonic ? 'none' : '4,2');

    // Inner circle (main body)
    node.append('circle')
      .attr('r', innerRadius)
      .attr('fill', d => d.color)
      .attr('stroke', (d: any) => d.id === selectedChordId ? 'white' : ((d as any).isAI ? '#facc15' : '#1e293b'))
      .attr('stroke-width', d => d.id === selectedChordId ? (isMobile ? 3 : 4) : ((d as any).isAI ? 4 : 2))
      .style('filter', (d: any) => (d as any).isAI ? 'drop-shadow(0 0 10px #facc15)' : 'none');

    // Chord Label (e.g. C, Dm)
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.1em')
      .attr('fill', d => d.isAI ? '#0f172a' : 'white')
      .attr('font-weight', '900')
      .attr('font-size', isMobile ? '12px' : '16px')
      .text(d => d.label)
      .style('pointer-events', 'none');

    // Roman Numeral (e.g. I, ii)
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.4em')
      .attr('fill', (d: any) => (d as any).isAI ? '#0f172a' : '#94a3b8')
      .attr('font-size', isMobile ? '9px' : '11px')
      .attr('font-weight', '900')
      .text(d => d.roman)
      .style('pointer-events', 'none');

    // AI Step Badge (e.g. 1°, 2°)
    const aiGroup = node.filter((d: any) => d.isAI && d.aiStep !== undefined);
    
    aiGroup.append('circle')
      .attr('cx', innerRadius * 0.8)
      .attr('cy', -innerRadius * 0.8)
      .attr('r', isMobile ? 7 : 9)
      .attr('fill', '#facc15')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1.5);

    aiGroup.append('text')
      .attr('x', innerRadius * 0.8)
      .attr('y', -innerRadius * 0.8)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#0f172a')
      .attr('font-size', isMobile ? '8px' : '10px')
      .attr('font-weight', '900')
      .text((d: any) => `${d.aiStep}°`)
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      link.attr('d', (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.8;
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    const zoom = d3.zoom()
      .scaleExtent([isMobile ? 0.3 : 0.2, 3])
      .on('zoom', (event) => g.attr('transform', event.transform));

    svg.call(zoom as any);
    
    if (isMobile) {
      svg.call(zoom.transform as any, d3.zoomIdentity.translate(width/2, height/2).scale(0.7).translate(-width/2, -height/2));
    }

    return () => { simulation.stop(); };
  }, [nodes, links, selectedChordId, onChordSelect]);

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-950 overflow-hidden relative">
      <svg ref={svgRef} className="w-full h-full touch-none"></svg>
    </div>
  );
};

export default HarmonyMap;
