export const androidRetrofitContracts = [
  ["login","POST","signin","JsonObject","BaseResponse<LoginResponse>","implemented"],
  ["resetPassword","POST","resetPassword","email query","BaseResponse<String>","implemented"],
  ["updateProfile","PUT","updateUserDetails","identity query + JsonObject","BaseResponse<ImageProfileResponse>","implemented"],
  ["getAssignmentsActive","GET","getassignmentsActiveUploadFinish","rigger_email query","AssignmentActiveTodayResponse","missing"],
  ["getAssignmentsUploadFinishById","GET","getassignmentsActiveUploadFinishById","rigger_email/id/status query","BaseListResponse<AssignmentData>","missing"],
  ["getAssignmentById","GET","getassignmentsById","assignment_id query","BaseResponse<AssignmentData>","implemented"],
  ["getDropReason","GET","getRejectDropReasonList","none","BaseListResponse<String>","implemented"],
  ["updateAssignment","PUT","updateAssignmentDetails","identity query + JsonObject","BaseResponse<AssignmentUpdateStateResponse>","implemented"],
  ["updateFullTowerAdditionalData","PUT","updateImageDetails","assignment/identity query + JsonObject","BaseResponse<AssignmentFullTowerResponse>","implemented"],
  ["updateCellDetails","PUT","updateCellDetails","rcell/identity query + JsonObject","BaseResponse<AssignmentCellResponse>","implemented"],
  ["updateJustification","PUT","updateImageDetails","assignment/identity query + JsonObject","BaseResponse<JustificationResponse>","implemented"],
  ["getUtility","GET","getUtility","none","BaseListResponse<UtilityResponse>","implemented"],
  ["getFullTowerData","GET","getImageDetails","assignment_id query","BaseResponse<FullTowerResponse>","implemented"],
  ["getCellData","GET","getCellDetails","assignment_id query","BaseListResponse<CellDataResponse>","implemented"],
  ["getAorSummaryById","GET","getAorSummaryById","assignment_id query","BaseResponse<AORResponse>","implemented"],
  ["setUploadedImage","PUT","updateImageDetails","assignment/identity query + JsonObject","BaseResponse<JustificationResponse>","implemented"],
  ["getCatalogs","GET","getCatalogs","t query","BaseResponse<CatalogResponse>","missing"],
];

export const stagingScenarios = [
  ["Login","signin","shadow-ready"],
  ["Load Assignment","getassignmentsById","shadow-ready"],
  ["Accept","updateAssignmentDetails","deferred-contract"],
  ["Check-in","updateAssignmentDetails","deferred-contract"],
  ["Pause","updateAssignmentDetails","shadow-ready"],
  ["Resume","updateAssignmentDetails","shadow-ready"],
  ["Reject","updateAssignmentDetails","shadow-ready"],
  ["Drop","updateAssignmentDetails","shadow-ready"],
  ["Finish","updateAssignmentDetails","shadow-ready"],
  ["Close","updateAssignmentToClosedByID","missing-route"],
  ["Read Tower","getImageDetails","shadow-ready"],
  ["Read Cell","getCellDetails","shadow-ready"],
  ["Update Cell","updateCellDetails","shadow-ready"],
  ["Update Sector","updateCellDetails","shadow-ready"],
  ["Upload Image Metadata","updateImageDetails","shadow-ready"],
  ["Logout","signout","android-caller-missing"],
];

export const modeExpectations = {
  "legacy-compatible": { blocks: false, androidWithoutBearer: true },
  observe: { blocks: false, androidWithoutBearer: true },
  enforce: { blocks: true, androidWithoutBearer: false },
};

export const characterizedCosts = {
  assignmentSimpleTransition: { reads: 2, writes: 1, fanout: 1 },
  assignmentDetail: { reads: 1, writes: 0, fanout: 0 },
  imageDetail: { reads: 1, writes: 0, fanout: 0 },
  aorSummary: { reads: 3, writes: 0, fanout: 0 },
  cellDetails: { reads: 1, writes: 0, fanout: 0 },
};