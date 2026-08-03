import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";
import { PageHeader } from "@/components/application-shell/page-header";
import { towerCoordinates, towerDisplay } from "@/features/tower/tower-mapper";
import type { Tower } from "@/features/tower/tower-types";
import type { AssignmentListItem } from "@/features/assignment/assignment-types";
import { TowerRelatedAssignments } from "./tower-related-assignments";
import { TowerDetailActions } from "./tower-detail-actions";
import { TowerEditDialog } from "./tower-edit-dialog";
const Field=({label,value}:{label:string;value:unknown})=><div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm text-slate-900">{towerDisplay(value as never)}</dd></div>;
const Section=({title,children}:{title:string;children:React.ReactNode})=><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-semibold">{title}</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</dl></section>;
export function TowerDetail({tower,relatedAssignments,relatedAssignmentsError,canEdit}:{tower:Tower;relatedAssignments:AssignmentListItem[];relatedAssignmentsError:boolean;canEdit:boolean}) {
  const coordinates=towerCoordinates(tower);
  const required=[["tower_id",tower.tower_id],["sitename",tower.sitename],["region",tower.region],["sub_region",tower.sub_region],["new_cluster_name",tower.new_cluster_name]];
  const missing=required.filter(([,v])=>v===null||v==="").map(([k])=>k);
  const description=[towerDisplay(tower.sitename),towerDisplay(tower.site_id),towerDisplay(tower.region),towerDisplay(tower.new_cluster_name),coordinates?`${coordinates.latitude}, ${coordinates.longitude}`:null].filter(Boolean).join(" · ");
  return <div className="space-y-4"><PageHeader title={towerDisplay(tower.tower_id)} description={description} actions={<div className="flex flex-wrap gap-2">{canEdit?<TowerEditDialog tower={tower}/>:null}<TowerDetailActions towerId={towerDisplay(tower.tower_id)} coordinates={coordinates}/></div>} />
    <Link href="/home/towers" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"><ArrowLeft className="size-4" aria-hidden="true"/>Back to Towers</Link>
    <Section title="General Information"><Field label="Tower ID" value={tower.tower_id}/><Field label="Site ID" value={tower.site_id}/><Field label="Site Name" value={tower.sitename}/><Field label="Site Type" value={tower.site_type}/><Field label="BTS Type" value={tower.bts_type}/><Field label="Cluster" value={tower.new_cluster_name}/></Section>
    <Section title="Administrative Location"><Field label="Region" value={tower.region}/><Field label="Sub Region" value={tower.sub_region}/><Field label="Province" value={tower.province}/><Field label="Kabupaten" value={tower.kabupaten}/><Field label="Kecamatan" value={tower.kecamatan}/></Section>
    <Section title="Coordinates"><Field label="Latitude" value={tower.latitude}/><Field label="Longitude" value={tower.longitude}/><div className="sm:col-span-2 lg:col-span-3"><TowerDetailActions towerId={towerDisplay(tower.tower_id)} coordinates={coordinates}/></div></Section>
    <Section title="Radio Configuration"><Field label="Antenna System" value={tower.antenna_system}/><Field label="Antenna Type" value={tower.antenna_type}/>{["g900","g1800","u900","u2100","l700","l850","l900","l1800","l2100","l2300","l2600"].map(key=><Field key={key} label={key.toUpperCase()} value={tower[key as keyof Tower]}/>)}</Section>
    <Section title="Assignment Compatibility Information"><Field label="Tower ID used by Assignment" value={tower.tower_id}/><Field label="Required source fields" value={missing.length?"Incomplete":"Present"}/><Field label="Missing required source fields" value={missing.length?missing.join(", "):"None"}/></Section>
    <Link href={`/home/towers/${encodeURIComponent(tower.firebaseKey)}/history`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"><History className="size-4" aria-hidden="true"/>History</Link>
    <TowerRelatedAssignments tower={tower} rows={relatedAssignments} failed={relatedAssignmentsError}/>
    {Object.keys(tower.additionalFields).length?<Section title="Record Metadata">{Object.entries(tower.additionalFields).sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=><Field key={key} label={key.replaceAll("_"," ")} value={value}/>)}</Section>:null}
  </div>;
}
