const BANDS = [
  "g900", "g1800", "u900", "u2100", "l900",
  "l1800", "l2100", "l850", "l2300",
];
const REGION_STAKEHOLDERS = {
  Jabo: "Jabo", West: "West", East: "East", Central: "Central", NW: "NW",
};
const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

const sanitizeKey = (value) =>
  String(value || "unknown").replace(/[.#$/[\]]/g, "_");
const pad2 = (value) => String(value).padStart(2, "0");

function isoWeek(dateValue) {
  const [year, month, day] = String(dateValue || "").split("-").map(Number);
  if (!year || !month || !day) return "unknown-week";
  const date = new Date(Date.UTC(year, month - 1, day));
  const target = new Date(date.valueOf());
  target.setUTCDate(date.getUTCDate() + 3 - ((date.getUTCDay() + 6) % 7));
  const first = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  first.setUTCDate(first.getUTCDate() + 3 - ((first.getUTCDay() + 6) % 7));
  const week = 1 + Math.round(
    ((target - first) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7,
  );
  return `${target.getUTCFullYear()}-W${pad2(week)}`;
}

function stakeholders(assignment) {
  const values = new Set(["National"]);
  if (REGION_STAKEHOLDERS[assignment.region]) {
    values.add(REGION_STAKEHOLDERS[assignment.region]);
  }
  if (assignment.company === "CCSI") values.add("CCSI");
  return [...values];
}

function stakeholderNode(value) {
  if (value === "National") return "national";
  if (value === "CCSI" || value === "NEXWAVE" || value === "NW") return "company";
  return "region";
}

function productivitySpecs(assignment, time) {
  const year = time.currDate.slice(0, 4);
  const hour = Number(time.currDatetime.slice(11, 13)) || 0;
  const week = isoWeek(time.currDate);
  return stakeholders(assignment).flatMap((stakeholder) => {
    const node = stakeholderNode(stakeholder);
    return [
      {
        basePath: `achievement/productivity/${year}/daily/${node}`,
        stakeholder,
        category: assignment.assignment_category || "Unknown",
        closedDate: time.currDate,
        index: time.currDate,
        indexStakeholder: `${stakeholder}_${time.currDate}`,
        label: "Daily",
        initial: "D",
      },
      {
        basePath: `achievement/productivity/${year}/hourly/${node}`,
        stakeholder,
        category: assignment.assignment_category || "Unknown",
        closedDate: time.currDate,
        index: `${time.currDate}_${pad2(hour)}`,
        indexStakeholder: `${stakeholder}_${time.currDate}_${pad2(hour)}`,
        label: "Hourly",
        initial: "H",
        hour,
      },
      {
        basePath: `achievement/productivity/${year}/weekly/${node}`,
        stakeholder,
        category: assignment.assignment_category || "Unknown",
        closedDate: time.currDate,
        index: week,
        indexStakeholder: `${stakeholder}_${week}`,
        label: "Weekly",
        initial: "W",
        week,
      },
    ];
  });
}

function assignmentUpdate(assignment, body, time) {
  return {
    closed_datetime: time.currDatetime,
    closed_date: time.currDate,
    assignment_state: body.assignment_state || "",
    assignment_status: "Closed",
    image_status: typeof body.image_status !== "undefined" ? body.image_status : "",
    rigger_email_assignment_status_tower_id:
      `${assignment.rigger_email}_Closed_${assignment.tower_id}`,
    rigger_email_assignment_status_assignment_id:
      `${assignment.rigger_email}_Closed_${assignment.assignment_id}`,
    index_created_date_assignment_state: `Finished_${assignment.created_date}`,
    index_closed_date_assignment_category:
      `${assignment.assignment_category}_${time.currDate}`,
    index_closed_date_tower_id: `${assignment.tower_id}_${time.currDate}`,
    index_closed_date_rigger_name: `${assignment.rigger_name}_${time.currDate}`,
    index_closed_date_coordinator_name:
      `${assignment.coordinator_name}_${time.currDate}`,
    index_closed_date_rno_name: `${assignment.rno_name}_${time.currDate}`,
    index_closed_date_region: `${assignment.region}_${time.currDate}`,
    index_closed_date_sub_region: `${assignment.sub_region}_${time.currDate}`,
    index_closed_date_province: `${assignment.province}_${time.currDate}`,
    index_closed_date_kabupaten: `${assignment.kabupaten}_${time.currDate}`,
    index_closed_date_kecamatan: `${assignment.kecamatan}_${time.currDate}`,
    index_closed_date_company: `${assignment.company}_${time.currDate}`,
    index_closed_date_completed: `false_${time.currDate}`,
    index_closed_date_ftp_check: `Not Available_${time.currDate}`,
    report_name: body.report_name,
    report_url: body.report_url,
    index_created_date_assignment_status: `Closed_${assignment.created_date}`,
    completed: false,
    index_created_date_completed: `false_${assignment.created_date}`,
  };
}

async function writeProductivity(repository, assignment, time) {
  const rigKey = sanitizeKey(assignment.rigger_email || "unknown");
  await Promise.all(productivitySpecs(assignment, time).map(async (spec) => {
    const row = await repository.findProductivityRow(
      spec.basePath,
      spec.indexStakeholder,
    );
    const key = row?.key ?? repository.createPushKey(spec.basePath);
    await repository.transactionProductivity(
      `${spec.basePath}/${key}`,
      (current) => {
        const value = current || {};
        value.stakeholder = spec.stakeholder;
        value.category = spec.category;
        value.closed_date = spec.closedDate;
        value.index = spec.index;
        value.index_closed_date_stakeholder = spec.indexStakeholder;
        value.time_level = spec.label;
        value.time_level_initial = spec.initial;
        if (spec.label === "Hourly") value.hour = spec.hour || 0;
        if (spec.label === "Weekly") value.week = spec.week || "unknown-week";
        value.total = (value.total || 0) + 1;
        if (spec.category) value[spec.category] = (value[spec.category] || 0) + 1;
        value.riggerSet = value.riggerSet || {};
        if (rigKey) value.riggerSet[rigKey] = true;
        value.total_rigger = Object.keys(value.riggerSet).length || 0;
        value.productivity = value.total_rigger > 0
          ? Number((value.total / value.total_rigger).toFixed(2))
          : 0;
        value.updated_at = repository.timestamp();
        return value;
      },
    );
  }));
}

async function writeRiggerAchievement(repository, assignment, user, time) {
  const [year, month, day] = time.currDate.split("-");
  const bucket = `${year} ${MONTHS[Number(month) - 1]}`;
  const basePath = `achievement/rigger/${bucket}`;
  const riggerEmail = assignment.rigger_email || user?.email || "";
  const index = `${riggerEmail}_${time.currDate}`;
  const row = await repository.findRiggerAchievement(basePath, index);
  const key = row?.key ?? repository.createPushKey(basePath);
  await repository.transactionRiggerAchievement(`${basePath}/${key}`, (current) => {
    const value = current || {};
    Object.assign(value, {
      closed_date: time.currDate,
      company: assignment.company || user?.company || "",
      date: day,
      index,
      region: assignment.region || user?.region || "",
      rigger_email: riggerEmail,
      rigger_name: assignment.rigger_name || user?.name || "",
      sub_region: assignment.sub_region || user?.sub_region || "",
      yearmonth: `${year}${month}`,
      yearmonthtext:
        `${year} ${MONTHS[Number(month) - 1][0].toUpperCase()}` +
        MONTHS[Number(month) - 1].slice(1),
    });
    value.total = (value.total || 0) + 1;
    value.updated_at = repository.timestamp();
    return value;
  });
}

export function createMobileAssignmentFinishService(repository, clock) {
  return {
    async finish(body) {
      const time = clock.current();
      const assignments = await repository.findAssignments(body.assignment_id);
      if (assignments.length === 0) return "The assignment not found";
      const assignmentRow = assignments[0];
      const users = assignmentRow.value?.rigger_email
        ? await repository.findUsersByEmail(assignmentRow.value.rigger_email)
        : [];
      const user = users[0]?.value ?? null;
      const closed = {
        closed_date: time.currDate,
        closed_datetime: time.currDatetime,
      };

      for (const band of BANDS) {
        const maximum = Number(assignmentRow.value?.[band] || 0);
        for (let sector = 1; sector <= maximum; sector += 1) {
          const rcellId =
            `sector_${sector}_${band}_${assignmentRow.value.assignment_id}`;
          await repository.upsertCell(rcellId, { ...closed, rcell_id: rcellId });
        }
      }
      await repository.updateImages(assignmentRow.value.assignment_id, closed);
      await repository.updateTower(assignmentRow.value.tower_id, {
        radaba_status: "Yes",
        region_radaba_status: `${assignmentRow.value.region}_Yes`,
        sub_region_radaba_status: `${assignmentRow.value.sub_region}_Yes`,
      });
      if (user) {
        await repository.updateUsersByEmail(assignmentRow.value.rigger_email, {
          radaba_status: "Yes",
          region_radaba_status: `${user.region}_Yes`,
          sub_region_radaba_status: `${user.sub_region}_Yes`,
          position_radaba_status: "Rigger_Yes",
          position_region_radaba_status: `Rigger_${user.region}_Yes`,
          position_company_radaba_status: `Rigger_${user.company}_Yes`,
          company_radaba_status: `${user.company}_Yes`,
          position_sub_region_radaba_status: `Rigger_${user.sub_region}_Yes`,
        });
      }
      const update = assignmentUpdate(assignmentRow.value, body, time);
      await repository.updateAssignment(assignmentRow.key, update);
      await Promise.all([
        writeProductivity(repository, assignmentRow.value, time),
        writeRiggerAchievement(repository, assignmentRow.value, user, time),
      ]);
      return update;
    },
  };
}

