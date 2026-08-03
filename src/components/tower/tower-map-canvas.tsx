"use client";
import { useEffect, useRef } from "react";
import { GeoJSONSource, LngLatBounds, Map as MapLibreMap, NavigationControl, Popup, type MapLayerMouseEvent } from "maplibre-gl";
import type { Feature, FeatureCollection, Point } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { TOWER_MAP_DEFAULT_CENTER, TOWER_MAP_DEFAULT_ZOOM, type TowerMapMarker } from "@/features/tower/tower-map-contract";

export default function TowerMapCanvas({ markers, onLoadFailure, picking=false, onLocationSelect, selectedTowerKey="", onMarkerSelect }: { markers:TowerMapMarker[]; onLoadFailure:()=>void;picking?:boolean;onLocationSelect?:(latitude:number,longitude:number)=>void;selectedTowerKey?:string;onMarkerSelect?:(towerKey:string)=>void }) {
  const container=useRef<HTMLDivElement>(null), map=useRef<MapLibreMap|null>(null), reset=useRef<()=>void>(()=>undefined),pickingRef=useRef(picking),selectRef=useRef(onLocationSelect),markerSelectRef=useRef(onMarkerSelect);
  useEffect(()=>{pickingRef.current=picking;selectRef.current=onLocationSelect;markerSelectRef.current=onMarkerSelect},[picking,onLocationSelect,onMarkerSelect]);
  useEffect(()=>{
    if(!container.current||map.current)return;
    const features:Feature<Point,{markerIndex:number}>[]=markers.map((marker,index)=>({type:"Feature",id:marker.towerKey,geometry:{type:"Point",coordinates:[marker.longitude,marker.latitude]},properties:{markerIndex:index}}));
    const data:FeatureCollection<Point,{markerIndex:number}>={type:"FeatureCollection",features};
    const instance=new MapLibreMap({
      container:container.current,
      style:{version:8,sources:{},layers:[{id:"privacy-safe-background",type:"background",paint:{"background-color":"#e2e8f0"}}]},
      center:[...TOWER_MAP_DEFAULT_CENTER],zoom:TOWER_MAP_DEFAULT_ZOOM,
    });
    map.current=instance;instance.addControl(new NavigationControl({showCompass:false}),"top-right");instance.on("error",onLoadFailure);
    instance.on("click",event=>{if(pickingRef.current)selectRef.current?.(event.lngLat.lat,event.lngLat.lng)});
    instance.on("load",()=>{
      instance.addSource("towers",{type:"geojson",data,cluster:true,clusterMaxZoom:14,clusterRadius:48});
      instance.addLayer({id:"tower-clusters",type:"circle",source:"towers",filter:["has","point_count"],paint:{"circle-color":"#4338ca","circle-radius":["step",["get","point_count"],18,25,24,100,30],"circle-stroke-color":"#fff","circle-stroke-width":2}});
      instance.addLayer({id:"tower-cluster-count",type:"symbol",source:"towers",filter:["has","point_count"],layout:{"text-field":["get","point_count_abbreviated"],"text-size":12},paint:{"text-color":"#fff"}});
      instance.addLayer({id:"tower-points",type:"circle",source:"towers",filter:["!",["has","point_count"]],paint:{"circle-color":"#0f766e","circle-radius":8,"circle-stroke-color":"#fff","circle-stroke-width":2}});
      instance.on("click","tower-clusters",async(event:MapLayerMouseEvent)=>{if(pickingRef.current)return;const feature=instance.queryRenderedFeatures(event.point,{layers:["tower-clusters"]})[0],id=Number(feature?.properties?.cluster_id),source=instance.getSource("towers");if(!(source instanceof GeoJSONSource)||!Number.isFinite(id)||feature?.geometry.type!=="Point")return;instance.easeTo({center:feature.geometry.coordinates as [number,number],zoom:await source.getClusterExpansionZoom(id)});});
      instance.on("click","tower-points",(event:MapLayerMouseEvent)=>{if(pickingRef.current)return;const marker=markers[Number(event.features?.[0]?.properties?.markerIndex)];if(!marker)return;markerSelectRef.current?.(marker.towerKey);showPopup(instance,marker);});
      for(const layer of ["tower-clusters","tower-points"]){instance.on("mouseenter",layer,()=>{instance.getCanvas().style.cursor="pointer"});instance.on("mouseleave",layer,()=>{instance.getCanvas().style.cursor=""});}
      const fit=()=>{if(!features.length){instance.jumpTo({center:[...TOWER_MAP_DEFAULT_CENTER],zoom:TOWER_MAP_DEFAULT_ZOOM});return;}const first=features[0].geometry.coordinates as [number,number],bounds=features.reduce((current,feature)=>current.extend(feature.geometry.coordinates as [number,number]),new LngLatBounds(first,first));instance.fitBounds(bounds,{padding:44,maxZoom:13,duration:0});};reset.current=fit;fit();
    });
    return()=>{instance.remove();map.current=null};
  },[markers,onLoadFailure]);
  useEffect(()=>{const instance=map.current,marker=markers.find(item=>item.towerKey===selectedTowerKey);if(!instance||!marker||picking)return;instance.easeTo({center:[marker.longitude,marker.latitude],zoom:Math.max(instance.getZoom(),12),duration:0});showPopup(instance,marker)},[selectedTowerKey,markers,picking]);
  return <div className="relative"><div ref={container} role="region" aria-label={`${picking?"Select a location for a new Tower":"Interactive Tower map"} with ${markers.length} mapped Towers`} className={`h-[62vh] min-h-[28rem] w-full overflow-hidden rounded-2xl sm:min-h-[34rem] ${picking?"cursor-crosshair":""}`}/><button type="button" onClick={()=>reset.current()} className="absolute bottom-3 left-3 z-10 min-h-11 rounded-xl bg-white px-3 text-sm font-semibold shadow focus-visible:ring-2 focus-visible:ring-indigo-500">Reset View</button></div>;
}
function showPopup(instance:MapLibreMap,marker:TowerMapMarker){const content=document.createElement("article"),title=document.createElement("strong");content.className="min-w-64 space-y-1 text-sm";title.textContent=marker.towerId||"Tower ID unavailable";content.append(title);const technology=(key:"gsm"|"umts"|"lte",label:string)=>`${label}: ${marker.network[key].known?`${marker.network[key].sectors} sectors`:"Unknown"}`;for(const [label,value]of [["Site ID",marker.siteId],["Site Name",marker.siteName],["Region / Sub Region",[marker.region,marker.subRegion].filter(Boolean).join(" / ")],["Tower / Site Type",marker.siteType],["Coordinates",`${marker.latitude}, ${marker.longitude}`],["Network",[technology("gsm","GSM"),technology("umts","UMTS"),technology("lte","LTE")].join(" · ")]]){const line=document.createElement("p");line.textContent=`${label}: ${value||"Unavailable"}`;content.append(line)}const actions=document.createElement("div");actions.className="mt-2 flex flex-wrap gap-2";for(const[label,href]of [["View Tower",`/home/towers/${encodeURIComponent(marker.towerKey)}`],["View Dependencies",`/home/towers/${encodeURIComponent(marker.towerKey)}?dependencies=1`],["View History",`/home/towers/${encodeURIComponent(marker.towerKey)}/history`]]){const link=document.createElement("a");link.href=href;link.textContent=label;link.className="font-semibold text-indigo-700";actions.append(link)}content.append(actions);new Popup({maxWidth:"360px"}).setLngLat([marker.longitude,marker.latitude]).setDOMContent(content).addTo(instance)}