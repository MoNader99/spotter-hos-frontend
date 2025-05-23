import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  DirectionsCar as DirectionsCarIcon,
  LocationOn as LocationOnIcon,
  AccessTime as AccessTimeIcon,
  Timeline as TimelineIcon,
  LocalGasStation as LocalGasStationIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import {
  fetchTripDetails,
  fetchTripRoute,
  assignTrip,
  addTripLog,
  fetchMyTrips,
  generateTripLogs,
} from "../redux/slices/tripsSlice";
import FuelStopsList from "../components/FuelStopsList";
import { formatDistance, formatTime } from "../utils/formatters";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom component to fit bounds when coordinates change
function MapBounds({ coordinates }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);

  return null;
}

// Custom component to handle map view changes
function MapViewChanger({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
}

// Custom icon for fuel stops using Material UI icon
const createCustomIcon = (icon, color) => {
  const svgIcon = document.createElement("div");
  svgIcon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${color}">
      <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33a2.5 2.5 0 0 0 2.5 2.5c.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5a2.5 2.5 0 0 0 5 0V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon.innerHTML,
    className: "custom-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const STATUS_LABELS = {
  OFF: "Off Duty",
  SB: "Sleeper Berth",
  D: "Driving",
  ON: "On Duty (Not Driving)",
};
const STATUS_COLORS = {
  OFF: "#4CAF50", // Green
  SB: "#2196F3", // Blue
  D: "#F44336", // Red
  ON: "#FFC107", // Yellow
};

// Helper function to format UTC time
function formatUTCTime(utcDate) {
  const date = new Date(utcDate);
  return date.toISOString().split("T")[1].substring(0, 5);
}

// Helper function to format UTC date
function formatUTCDate(utcDate) {
  const date = new Date(utcDate);
  return date.toISOString().split("T")[0];
}

// Helper function to get interval index for UTC time
function getIntervalIndex(date) {
  const d = new Date(date);
  return d.getUTCHours() * 4 + Math.floor(d.getUTCMinutes() / 15);
}

// Helper function to calculate duration in hours
function calculateDuration(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return ((end - start) / (1000 * 60 * 60)).toFixed(2);
}

// Helper function to get total hours for a status
function getTotalHoursForStatus(logs, status) {
  return logs
    .filter((log) => log.status === status)
    .reduce((sum, log) => {
      const start = new Date(log.start_time);
      const end = log.end_time ? new Date(log.end_time) : new Date();
      return sum + (end - start) / (1000 * 60 * 60);
    }, 0)
    .toFixed(2);
}

const HOSGrid = ({ logs }) => {
  // Group logs by date
  const logsByDate = logs.reduce((acc, log) => {
    const date = log.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {});

  // 96 intervals of 15 minutes each (24 hours * 4 intervals per hour)
  const intervals = Array.from({ length: 96 }, (_, i) => i);

  // Helper: format hour for display
  function formatHour(interval) {
    const hour = Math.floor(interval / 4);
    return hour === 0
      ? "00:00"
      : hour === 12
      ? "12:00"
      : hour < 10
      ? `0${hour}:00`
      : `${hour}:00`;
  }

  return (
    <>
      {Object.entries(logsByDate)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, dayLogs]) => (
          <Box
            key={date}
            sx={{
              overflowX: "auto",
              mt: 3,
              mb: 3,
              bgcolor: "#fff",
              borderRadius: 2,
              p: 2,
              boxShadow: 1,
            }}
          >
            <Typography variant="h6" gutterBottom>
              HOS Grid - {date} (UTC)
            </Typography>
            {/* Header row: hours */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `120px repeat(96, 1fr) 50px`,
                alignItems: "center",
                fontWeight: 600,
                mb: 1,
              }}
            >
              <Box />
              {intervals.map((i) =>
                i % 4 === 0 ? (
                  <Box key={i} sx={{ textAlign: "center", fontSize: 12 }}>
                    {formatHour(i)}
                  </Box>
                ) : (
                  <Box key={i} />
                )
              )}
              <Box sx={{ textAlign: "center", fontSize: 12, ml: 1 }}>Total</Box>
            </Box>
            {Object.keys(STATUS_LABELS).map((status) => (
              <Box
                key={status}
                sx={{
                  display: "grid",
                  gridTemplateColumns: `120px repeat(96, 1fr) 50px`,
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Box sx={{ fontWeight: 500 }}>{STATUS_LABELS[status]}</Box>
                {intervals.map((interval) => {
                  // Is there a log for this status that covers this interval?
                  const log = dayLogs.find((l) => {
                    if (l.status !== status) return false;
                    const startIdx = getIntervalIndex(l.start_time);
                    const endIdx = l.end_time
                      ? getIntervalIndex(l.end_time)
                      : 95;
                    return interval >= startIdx && interval <= endIdx;
                  });
                  return (
                    <Box
                      key={interval}
                      sx={{
                        height: 24,
                        bgcolor: log ? STATUS_COLORS[status] : "#f5f5f5",
                        borderRadius: 1,
                        opacity: log ? 0.85 : 1,
                        border: "1px solid #e0e0e0",
                      }}
                      title={
                        log
                          ? `${STATUS_LABELS[status]}: ${formatUTCTime(
                              log.start_time
                            )} - ${
                              log.end_time
                                ? formatUTCTime(log.end_time)
                                : "Ongoing"
                            }`
                          : ""
                      }
                    />
                  );
                })}
                <Box sx={{ textAlign: "right", fontWeight: 500, ml: 1 }}>
                  {getTotalHoursForStatus(dayLogs, status)}
                </Box>
              </Box>
            ))}
          </Box>
        ))}
    </>
  );
};

const STATUS_CHOICES = [
  { value: "OFF", label: "Off Duty" },
  { value: "SB", label: "Sleeper Berth" },
  { value: "D", label: "Driving" },
  { value: "ON", label: "On Duty (Not Driving)" },
];

const AddLogEntrySwitcher = ({ tripId, onLogAdded }) => {
  const [mode, setMode] = useState("manual");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    const result = await dispatch(generateTripLogs(tripId));
    setGenerating(false);
    if (!result.error) {
      if (onLogAdded) onLogAdded();
    } else {
      setError(result.error?.message || "Failed to auto-generate logs.");
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <FormControlLabel
        control={
          <Switch
            checked={mode === "auto"}
            onChange={() => setMode(mode === "manual" ? "auto" : "manual")}
            color="primary"
          />
        }
        label={mode === "auto" ? "Auto-Generate Logs" : "Manual Log Entry"}
      />
      {mode === "manual" ? (
        <AddTripLogForm tripId={tripId} onLogAdded={onLogAdded} />
      ) : (
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerate}
            disabled={generating}
            fullWidth
          >
            {generating ? "Generating..." : "Auto-Generate Logs"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

const AddTripLogForm = ({ tripId, onLogAdded }) => {
  const [form, setForm] = useState({
    status: "D",
    location: "",
    remarks: "",
    start_time: new Date(),
    end_time: new Date(),
  });
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name) => (date) => {
    setForm((prev) => ({ ...prev, [name]: date }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Convert local times to UTC before sending to backend
    const startTimeUTC = new Date(
      form.start_time.getTime() - form.start_time.getTimezoneOffset() * 60000
    );
    const endTimeUTC = new Date(
      form.end_time.getTime() - form.end_time.getTimezoneOffset() * 60000
    );

    const result = await dispatch(
      addTripLog({
        tripId,
        logData: {
          trip: tripId,
          status: form.status,
          location: form.location,
          remarks: form.remarks,
          start_time: startTimeUTC.toISOString(),
          end_time: endTimeUTC.toISOString(),
        },
      })
    );
    setSubmitting(false);
    if (!result.error) {
      setForm({
        status: "D",
        location: "",
        remarks: "",
        start_time: new Date(),
        end_time: new Date(),
      });
      if (onLogAdded) onLogAdded();
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Add Log Entry
      </Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Status</InputLabel>
        <Select
          name="status"
          value={form.status}
          onChange={handleChange}
          label="Status"
        >
          {STATUS_CHOICES.map((choice) => (
            <MenuItem key={choice.value} value={choice.value}>
              {choice.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        fullWidth
        label="Location"
        name="location"
        value={form.location}
        onChange={handleChange}
        sx={{ mb: 2 }}
        required
      />
      <TextField
        fullWidth
        label="Remarks"
        name="remarks"
        value={form.remarks}
        onChange={handleChange}
        multiline
        rows={2}
        sx={{ mb: 2 }}
      />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <DateTimePicker
              label="Start Time"
              value={form.start_time}
              onChange={handleDateChange("start_time")}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DateTimePicker
              label="End Time"
              value={form.end_time}
              onChange={handleDateChange("end_time")}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
        </Grid>
      </LocalizationProvider>
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3 }}
        disabled={submitting}
      >
        {submitting ? "Adding..." : "Add Log Entry"}
      </Button>
    </Box>
  );
};

const TripDetails = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentTrip, tripRoute, loading, error } = useSelector(
    (state) => state.trips
  );
  const { user } = useSelector((state) => state.auth);
  const [mapKey, setMapKey] = useState(0);
  const [showFuelStops, setShowFuelStops] = useState(true);
  const [selectedFuelStop, setSelectedFuelStop] = useState(null);
  const [mapView, setMapView] = useState(null);
  const [logData, setLogData] = useState({
    status: "D",
    location: "",
    remarks: "",
    start_time: new Date(),
    end_time: new Date(),
  });

  useEffect(() => {
    dispatch(fetchTripDetails(tripId));
    dispatch(fetchTripRoute(tripId));
  }, [dispatch, tripId]);

  useEffect(() => {
    if (tripRoute) {
      setMapKey((prev) => prev + 1);
    }
  }, [tripRoute]);

  const handleAssignTrip = async () => {
    try {
      const result = await dispatch(assignTrip(tripId));
      if (!result.error) {
        dispatch(fetchTripDetails(tripId));
        dispatch(fetchMyTrips());
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const handleFuelStopClick = (stop) => {
    setSelectedFuelStop(stop);
    setMapView({ center: stop.location, zoom: 14 });
  };

  const getMapCenter = () => {
    if (tripRoute?.coordinates?.length > 0) {
      const start = tripRoute.coordinates[0];
      const end = tripRoute.coordinates[tripRoute.coordinates.length - 1];
      return [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
    }
    return [40.7128, -74.006];
  };

  const processCoordinates = (coordinates) => {
    if (!coordinates || !Array.isArray(coordinates)) return [];
    return coordinates
      .map((coord) => {
        if (Array.isArray(coord) && coord.length === 2) {
          return [parseFloat(coord[0]), parseFloat(coord[1])];
        }
        return null;
      })
      .filter((coord) => coord !== null);
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(
      addTripLog({
        tripId,
        logData: {
          ...logData,
          trip: tripId,
          start_time: logData.start_time.toISOString(),
          end_time: logData.end_time.toISOString(),
        },
      })
    );
    if (!result.error) {
      setLogData({
        status: "D",
        location: "",
        remarks: "",
        start_time: new Date(),
        end_time: new Date(),
      });
      dispatch(fetchTripDetails(tripId)); // Refresh logs
    }
  };

  // Add this before the return statement in TripDetails
  const processedCoords = Array.isArray(tripRoute?.coordinates)
    ? processCoordinates(tripRoute.coordinates)
    : [];
  const isMapReady =
    processedCoords.length > 0 &&
    processedCoords.every(
      (c) =>
        Array.isArray(c) &&
        c.length === 2 &&
        typeof c[0] === "number" &&
        typeof c[1] === "number" &&
        !isNaN(c[0]) &&
        !isNaN(c[1])
    );

  const renderDailyLogTable = (logs, date) => {
    return (
      <Card sx={{ mt: 4 }} key={date}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Log History -{" "}
            {new Date(date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {STATUS_LABELS[log.status] || log.status}
                    </TableCell>
                    <TableCell>{log.location}</TableCell>
                    <TableCell>
                      {new Date(log.start_time).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      {log.end_time
                        ? new Date(log.end_time).toLocaleTimeString()
                        : "Ongoing"}
                    </TableCell>
                    <TableCell>
                      {log.end_time
                        ? (
                            (new Date(log.end_time) -
                              new Date(log.start_time)) /
                            (1000 * 60 * 60)
                          ).toFixed(1)
                        : "-"}{" "}
                      hrs
                    </TableCell>
                    <TableCell>{log.remarks || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {/* Show daily summary for this date */}
          {currentTrip.daily_logs?.find((dl) => dl.date === date) && (
            <Box
              sx={{ mt: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Daily Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">
                    Driving Hours
                  </Typography>
                  <Typography variant="body1">
                    {currentTrip.daily_logs
                      .find((dl) => dl.date === date)
                      .driving_hours.toFixed(1)}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">
                    On Duty Hours
                  </Typography>
                  <Typography variant="body1">
                    {currentTrip.daily_logs
                      .find((dl) => dl.date === date)
                      .on_duty_hours.toFixed(1)}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">
                    Off Duty Hours
                  </Typography>
                  <Typography variant="body1">
                    {currentTrip.daily_logs
                      .find((dl) => dl.date === date)
                      .off_duty_hours.toFixed(1)}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">
                    Sleeper Berth Hours
                  </Typography>
                  <Typography variant="body1">
                    {currentTrip.daily_logs
                      .find((dl) => dl.date === date)
                      .sleeper_berth_hours.toFixed(1)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderLogHistory = () => {
    if (!currentTrip?.logs || currentTrip.logs.length === 0) {
      return (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Log History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No logs available for this trip.
            </Typography>
          </CardContent>
        </Card>
      );
    }

    // Group logs by date
    const logsByDate = currentTrip.logs.reduce((acc, log) => {
      const date = log.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(log);
      return acc;
    }, {});

    // Sort dates and render a table for each date
    return Object.keys(logsByDate)
      .sort()
      .map((date) => (
        <Card sx={{ mt: 4 }} key={date}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Log History - {date}
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Start Time (UTC)</TableCell>
                    <TableCell>End Time (UTC)</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logsByDate[date].map((log, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {STATUS_LABELS[log.status] || log.status}
                      </TableCell>
                      <TableCell>{log.location}</TableCell>
                      <TableCell>{formatUTCTime(log.start_time)}</TableCell>
                      <TableCell>
                        {log.end_time ? formatUTCTime(log.end_time) : "Ongoing"}
                      </TableCell>
                      <TableCell>
                        {log.end_time
                          ? `${calculateDuration(
                              log.start_time,
                              log.end_time
                            )} hrs`
                          : "-"}
                      </TableCell>
                      <TableCell>{log.remarks || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Show daily summary for this date */}
            {currentTrip.daily_logs?.find((dl) => dl.date === date) && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "background.paper",
                  borderRadius: 1,
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Daily Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      Driving Hours
                    </Typography>
                    <Typography variant="body1">
                      {currentTrip.daily_logs
                        .find((dl) => dl.date === date)
                        .driving_hours.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      On Duty Hours
                    </Typography>
                    <Typography variant="body1">
                      {currentTrip.daily_logs
                        .find((dl) => dl.date === date)
                        .on_duty_hours.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      Off Duty Hours
                    </Typography>
                    <Typography variant="body1">
                      {currentTrip.daily_logs
                        .find((dl) => dl.date === date)
                        .off_duty_hours.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      Sleeper Berth Hours
                    </Typography>
                    <Typography variant="body1">
                      {currentTrip.daily_logs
                        .find((dl) => dl.date === date)
                        .sleeper_berth_hours.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>
      ));
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 3 }}>
          {error.detail || "An error occurred"}
        </Alert>
      </Container>
    );
  }

  if (!currentTrip || !tripRoute) {
    return null;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Trip Details
        </Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Trip Information
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <LocationOnIcon sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="body1">
                  From: {currentTrip.pickup_location}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <LocationOnIcon sx={{ mr: 1, color: "secondary.main" }} />
                <Typography variant="body1">
                  To: {currentTrip.dropoff_location}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <TimelineIcon sx={{ mr: 1, color: "text.secondary" }} />
                <Typography variant="body1">
                  Total Distance:{" "}
                  {formatDistance(tripRoute.total_distance_miles)} miles
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <AccessTimeIcon sx={{ mr: 1, color: "text.secondary" }} />
                <Typography variant="body1">
                  Estimated Time:{" "}
                  {formatTime(tripRoute.estimated_total_time_hours)}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Status: {currentTrip.status}
              </Typography>
              {currentTrip.status === "NOT_STARTED" && !currentTrip.driver && (
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<DirectionsCarIcon />}
                  onClick={handleAssignTrip}
                  sx={{ mt: 2 }}
                >
                  Assign Trip
                </Button>
              )}
            </CardContent>
          </Card>

          <FuelStopsList
            fuelStops={tripRoute.fuel_stops}
            onFuelStopClick={handleFuelStopClick}
          />

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Route Steps
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                {tripRoute.steps?.map((step, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Step {index + 1}
                    </Typography>
                    <Typography variant="body1">{step.instruction}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Distance: {formatDistance(step.distance_miles)} miles |
                      Time: {formatTime(step.estimated_time_hours)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: "auto" }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ position: "relative", height: 500 }}>
                <Box
                  sx={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    zIndex: 1000,
                    backgroundColor: "white",
                    borderRadius: 1,
                    boxShadow: 1,
                    p: 1,
                  }}
                >
                  <Tooltip
                    title={
                      showFuelStops ? "Hide Fuel Stops" : "Show Fuel Stops"
                    }
                  >
                    <IconButton
                      onClick={() => setShowFuelStops(!showFuelStops)}
                      color={showFuelStops ? "primary" : "default"}
                    >
                      {showFuelStops ? (
                        <VisibilityIcon />
                      ) : (
                        <VisibilityOffIcon />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
                {/* Only render MapContainer if coordinates are valid and non-empty */}
                {isMapReady && (
                  <MapContainer
                    center={getMapCenter()}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    {mapView && (
                      <MapViewChanger
                        center={mapView.center}
                        zoom={mapView.zoom}
                      />
                    )}
                    <>
                      <Marker position={processedCoords[0]}>
                        <Popup>Start Location</Popup>
                      </Marker>
                      <Marker position={processedCoords.slice(-1)[0]}>
                        <Popup>End Location</Popup>
                      </Marker>
                      <Polyline
                        positions={processedCoords}
                        color="#0d47a1"
                        weight={5}
                        opacity={0.8}
                        dashArray="10, 10"
                      />
                      <MapBounds coordinates={processedCoords} />
                    </>
                    {showFuelStops &&
                      tripRoute?.fuel_stops?.map((stop, index) => (
                        <React.Fragment key={`fuel-stop-${index}`}>
                          <Marker
                            position={stop.location}
                            icon={createCustomIcon(
                              LocalGasStationIcon,
                              "#1976d2"
                            )}
                          >
                            <Popup>
                              <Typography variant="subtitle1" gutterBottom>
                                Fuel Stop {index + 1}
                              </Typography>
                              <Typography variant="body2">
                                Distance:{" "}
                                {formatDistance(stop.distance_from_start)} miles
                              </Typography>
                              <Typography variant="body2">
                                {stop.gas_stations.length} gas stations nearby
                              </Typography>
                            </Popup>
                          </Marker>
                          {selectedFuelStop === stop &&
                            stop.gas_stations.map((station, stationIndex) => (
                              <Marker
                                key={`gas-station-${stationIndex}`}
                                position={station.location}
                                icon={createCustomIcon(
                                  LocalGasStationIcon,
                                  "#f44336"
                                )}
                              >
                                <Popup>
                                  <Typography variant="subtitle1" gutterBottom>
                                    {station.name}
                                  </Typography>
                                  {station.brand && (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      Brand: {station.brand}
                                    </Typography>
                                  )}
                                  <Typography variant="body2">
                                    Distance: {formatDistance(station.distance)}{" "}
                                    miles
                                  </Typography>
                                </Popup>
                              </Marker>
                            ))}
                        </React.Fragment>
                      ))}
                  </MapContainer>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Only show Add Log form if trip has started and has a driver */}
          {currentTrip.driver && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <AddLogEntrySwitcher
                  tripId={tripId}
                  onLogAdded={() => dispatch(fetchTripDetails(tripId))}
                />
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Show HOS Grid if there are logs */}
      {currentTrip.driver && currentTrip.logs && (
        <HOSGrid logs={currentTrip.logs} />
      )}

      {/* Show log history with daily tables */}
      {currentTrip.driver && currentTrip.logs && renderLogHistory()}
    </Container>
  );
};

export default TripDetails;
