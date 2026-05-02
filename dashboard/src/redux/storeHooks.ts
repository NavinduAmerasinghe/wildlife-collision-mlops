import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";
import { updateHomeField, updateLocationField, updateAnalyticsField, updateTrafficField } from "./uireducer";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useHomeState = <K extends keyof RootState["ui"]["homeView"]>(key: K) => {
  const dispatch = useAppDispatch();
  const value = useAppSelector(
    (state: RootState) => state.ui.homeView[key]
  );
  const setValue = (val: RootState["ui"]["homeView"][K]) => {
    dispatch(updateHomeField({ key, value: val }));
  };
  return [value, setValue] as const;
}

export const useLocationState = <K extends keyof RootState["ui"]["locationView"]>(key: K) => {
  const dispatch = useAppDispatch();
  const value = useAppSelector(
    (state: RootState) => state.ui.locationView[key]
  );
  const setValue = (val: RootState["ui"]["locationView"][K]) => {
    dispatch(updateLocationField({ key, value: val }));
  };
  return [value, setValue] as const;
}

export const useAnalyticsState = <K extends keyof RootState["ui"]["analyticsView"]>(key: K) => {
  const dispatch = useAppDispatch();
  const value = useAppSelector(
    (state: RootState) => state.ui.analyticsView[key]
  );
  const setValue = (val: RootState["ui"]["analyticsView"][K]) => {
    dispatch(updateAnalyticsField({ key, value: val }));
  };
  return [value, setValue] as const;
}

export const useTrafficState = <K extends keyof RootState["ui"]["trafficView"]>(key: K) => {
  const dispatch = useAppDispatch();
  const value = useAppSelector(
    (state: RootState) => state.ui.trafficView[key]
  );
  const setValue = (val: RootState["ui"]["trafficView"][K]) => {
    dispatch(updateTrafficField({ key, value: val }));
  };
  return [value, setValue] as const;
}