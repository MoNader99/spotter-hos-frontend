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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  DirectionsCar as DirectionsCarIcon,
  LocationOn as LocationOnIcon,
  AccessTime as AccessTimeIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import {
  fetchTripDetails,
  addTripLog,
  completeTrip,
} from "../redux/slices/tripsSlice";

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

function getHourFraction(date) {
  const d = new Date(date);
  return d.getHours() + d.getMinutes() / 60;
}

function getTotalHoursForStatus(logs, status) {
  return logs
    .filter((log) => log.status === status)
    .reduce((sum, log) => {
      const start = getHourFraction(log.start_time);
      const end = log.end_time ? getHourFraction(log.end_time) : 24;
      return sum + (end - start);
    }, 0)
    .toFixed(1);
}

const HOSGrid = ({ logs }) => {
  const timelineHours = Array.from({ length: 24 }, (_, i) => i);
  return (
    <Box
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
      <Box sx={{ display: "flex", fontWeight: 600, mb: 1 }}>
        <Box sx={{ width: 120 }} />
        {timelineHours.map((h) => (
          <Box key={h} sx={{ width: 24, textAlign: "center", fontSize: 12 }}>
            {h === 0 ? "Mid" : h}
          </Box>
        ))}
        <Box sx={{ width: 40, textAlign: "center", fontSize: 12, ml: 1 }}>
          Total
        </Box>
      </Box>
      {Object.keys(STATUS_LABELS).map((status) => (
        <Box key={status} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Box sx={{ width: 120, fontWeight: 500 }}>
            {STATUS_LABELS[status]}
          </Box>
          <Box
            sx={{
              display: "flex",
              flex: 1,
              position: "relative",
              height: 24,
              bgcolor: "#f5f5f5",
              mx: 1,
              borderRadius: 1,
            }}
          >
            {logs
              .filter((log) => log.status === status)
              .map((log, idx) => {
                const start = getHourFraction(log.start_time);
                const end = log.end_time ? getHourFraction(log.end_time) : 24;
                const left = `${(start / 24) * 100}%`;
                const width = `${((end - start) / 24) * 100}%`;
                return (
                  <Box
                    key={idx}
                    sx={{
                      position: "absolute",
                      left,
                      width,
                      height: "100%",
                      bgcolor: STATUS_COLORS[status],
                      borderRadius: 1,
                      opacity: 0.85,
                    }}
                    title={`${STATUS_LABELS[status]}: ${new Date(
                      log.start_time
                    ).toLocaleTimeString()} - ${
                      log.end_time
                        ? new Date(log.end_time).toLocaleTimeString()
                        : "Ongoing"
                    }`}
                  />
                );
              })}
          </Box>
          <Box sx={{ width: 40, textAlign: "right", fontWeight: 500, ml: 1 }}>
            {getTotalHoursForStatus(logs, status)}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const TripLogging = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentTrip, loading, error } = useSelector((state) => state.trips);
  const { user } = useSelector((state) => state.auth);
  const [logData, setLogData] = useState({
    status: "D", // D for Driving, S for Sleeper, O for Off-duty
    location: "",
    remarks: "",
    start_time: new Date(),
    end_time: new Date(),
  });

  // Fix: handle both driver as object or ID
  let isDriver = false;
  if (currentTrip?.driver && user) {
    if (typeof currentTrip.driver === "object" && currentTrip.driver !== null) {
      isDriver =
        currentTrip.driver.username === user.username ||
        currentTrip.driver.id === user.id;
    } else {
      isDriver = currentTrip.driver === user.id;
    }
  }
  // Debug log
  console.log(
    "currentTrip.driver",
    currentTrip?.driver,
    "user",
    user,
    "isDriver",
    isDriver,
    "trip status",
    currentTrip?.status
  );

  useEffect(() => {
    dispatch(fetchTripDetails(tripId));
  }, [dispatch, tripId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLogData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (name) => (date) => {
    setLogData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  const handleSubmit = async (e) => {
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
    }
  };

  const handleCompleteTrip = async () => {
    const result = await dispatch(completeTrip(tripId));
    if (!result.error) {
      navigate("/");
    }
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

  if (!currentTrip) {
    return null;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Trip Logging
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Trip Information
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
                  Current Location: {currentTrip.current_location}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <AccessTimeIcon sx={{ mr: 1, color: "text.secondary" }} />
                <Typography variant="body1">
                  Cycle Hours Used: {currentTrip.current_cycle_used} hours
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {isDriver && currentTrip.status === "IN_PROGRESS" && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Add Log Entry
                </Typography>
                <Box component="form" onSubmit={handleSubmit}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={logData.status}
                      onChange={handleChange}
                      label="Status"
                    >
                      <MenuItem value="OFF">Off Duty</MenuItem>
                      <MenuItem value="SB">Sleeper Berth</MenuItem>
                      <MenuItem value="D">Driving</MenuItem>
                      <MenuItem value="ON">On Duty (Not Driving)</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Location"
                    name="location"
                    value={logData.location}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Remarks"
                    name="remarks"
                    value={logData.remarks}
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
                          value={logData.start_time}
                          onChange={handleDateChange("start_time")}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <DateTimePicker
                          label="End Time"
                          value={logData.end_time}
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
                    startIcon={<DirectionsCarIcon />}
                  >
                    Add Log Entry
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {currentTrip.logs && <HOSGrid logs={currentTrip.logs} />}
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Log History
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Start Time</TableCell>
                      <TableCell>End Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentTrip.logs?.map((log, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {log.status === "D"
                            ? "Driving"
                            : log.status === "S"
                            ? "Sleeper"
                            : "Off-duty"}
                        </TableCell>
                        <TableCell>{log.location}</TableCell>
                        <TableCell>
                          {new Date(log.start_time).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(log.end_time).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {currentTrip.status === "IN_PROGRESS" && (
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  onClick={handleCompleteTrip}
                  sx={{ mt: 3 }}
                >
                  Complete Trip
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TripLogging;
