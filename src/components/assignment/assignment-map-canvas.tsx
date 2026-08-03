"use client";

import { useEffect, useRef } from "react";
import { GeoJSONSource, LngLatBounds, Map as MapLibreMap, NavigationControl, type MapLayerMouseEvent } from "maplibre-gl";
import type { Feature, FeatureCollection, Point } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import type { AssignmentMapMarker } from "@/features/assignment/assignment-map-contract";

const markerColor = (state: string, status: string) => {
  if (state === "Escalated") return "#991b1b";
  if (state === "Overdue") return "#e11d48";
  if (state === "Warning") return "#d97706";
  return status === "Finished" ? "#059669"
    : status === "Paused" ? "#7c3aed"
      : status === "On Progress" ? "#2563eb"
        : status === "Accepted" ? "#0891b2" : "#475569";
};

export default function AssignmentMapCanvas({
  markers,
  selectedKey,
  select,
  styleUrl,
}: {
  markers: AssignmentMapMarker[];
  selectedKey: string | null;
  select: (key: string) => void;
  styleUrl: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const selectRef = useRef(select);

  useEffect(() => {
    selectRef.current = select;
  }, [select]);

  useEffect(() => {
    if (!container.current || map.current || !styleUrl) return;
    interface AssignmentPointProperties { key: string; color: string }
    const features: Feature<Point, AssignmentPointProperties>[] = markers.map((marker) => ({
      type: "Feature" as const,
      id: marker.key,
      geometry: { type: "Point" as const, coordinates: [marker.longitude, marker.latitude] },
      properties: { key: marker.key, color: markerColor(marker.slaState, marker.status) },
    }));
    const featureCollection: FeatureCollection<Point, AssignmentPointProperties> = { type: "FeatureCollection", features };
    const instance = new MapLibreMap({
      container: container.current,
      style: styleUrl,
      center: [117, -2],
      zoom: 4,
    });
    map.current = instance;
    instance.addControl(new NavigationControl({ showCompass: false }), "top-right");
    instance.on("load", () => {
      instance.addSource("assignments", {
        type: "geojson",
        data: featureCollection,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 48,
      });
      instance.addLayer({
        id: "assignment-clusters", type: "circle", source: "assignments",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#4338ca",
          "circle-radius": ["step", ["get", "point_count"], 18, 25, 24, 100, 30],
          "circle-stroke-color": "#ffffff", "circle-stroke-width": 2,
        },
      });
      instance.addLayer({
        id: "assignment-cluster-count", type: "symbol", source: "assignments",
        filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
        paint: { "text-color": "#ffffff" },
      });
      instance.addLayer({
        id: "assignment-points", type: "circle", source: "assignments",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"], "circle-radius": 8,
          "circle-stroke-color": "#ffffff", "circle-stroke-width": 2,
        },
      });
      instance.on("click", "assignment-clusters", async (event: MapLayerMouseEvent) => {
        const feature = instance.queryRenderedFeatures(event.point, { layers: ["assignment-clusters"] })[0];
        const clusterId = Number(feature?.properties?.cluster_id);
        if (!Number.isFinite(clusterId)) return;
        const source = instance.getSource("assignments");
        if (!(source instanceof GeoJSONSource) || feature?.geometry.type !== "Point") return;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        const coordinates = feature.geometry.coordinates as [number, number];
        instance.easeTo({ center: coordinates, zoom });
      });
      instance.on("click", "assignment-points", (event: MapLayerMouseEvent) => {
        const key = String(event.features?.[0]?.properties?.key ?? "");
        if (key) selectRef.current(key);
      });
      for (const layer of ["assignment-clusters", "assignment-points"]) {
        instance.on("mouseenter", layer, () => { instance.getCanvas().style.cursor = "pointer"; });
        instance.on("mouseleave", layer, () => { instance.getCanvas().style.cursor = ""; });
      }
      if (features.length) {
        const first = features[0].geometry.coordinates as [number, number];
        const bounds = features.reduce(
          (current, feature) => current.extend(feature.geometry.coordinates as [number, number]),
          new LngLatBounds(first, first),
        );
        instance.fitBounds(bounds, { padding: 44, maxZoom: 13, duration: 0 });
      }
    });
    return () => { instance.remove(); map.current = null; };
  }, [markers, styleUrl]);

  useEffect(() => {
    const marker = markers.find((item) => item.key === selectedKey);
    if (marker && map.current?.loaded()) {
      map.current.easeTo({
        center: [marker.longitude, marker.latitude],
        zoom: Math.max(map.current.getZoom(), 12),
      });
    }
  }, [markers, selectedKey]);

  return <div ref={container} role="application" aria-label={`Interactive Assignment map with ${markers.length} mapped Assignments`} className="h-[55vh] min-h-[24rem] w-full overflow-hidden rounded-2xl" />;
}
