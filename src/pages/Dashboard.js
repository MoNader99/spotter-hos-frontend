import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
import {
  DirectionsCar as DirectionsCarIcon,
  LocationOn as LocationOnIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { fetchAvailableTrips } from "../redux/slices/tripsSlice";

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { availableTrips, loading, error } = useSelector(
    (state) => state.trips
  );
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchAvailableTrips());
  }, [dispatch]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderTripCard = (trip) => (
    <Grid item xs={12} md={6} lg={4} key={trip.id}>
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          "&:hover": {
            boxShadow: 6,
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Trip #{trip.id}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Created: {formatDate(trip.created_at)}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <LocationOnIcon sx={{ mr: 1, color: "primary.main" }} />
            <Typography variant="body2">
              From: {trip.pickup_location}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <LocationOnIcon sx={{ mr: 1, color: "secondary.main" }} />
            <Typography variant="body2">To: {trip.dropoff_location}</Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 2,
            }}
          >
            <AccessTimeIcon sx={{ mr: 1, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              Status: {trip.status}
            </Typography>
          </Box>
        </CardContent>

        <Box sx={{ p: 2, pt: 0 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<DirectionsCarIcon />}
            onClick={() => navigate(`/trips/${trip.id}`)}
          >
            View Details
          </Button>
        </Box>
      </Card>
    </Grid>
  );

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

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {user?.username}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.detail || "An error occurred"}
        </Alert>
      )}

      <Typography variant="h5" sx={{ mb: 3 }}>
        Available Trips
      </Typography>

      <Grid container spacing={3}>
        {availableTrips.length > 0 ? (
          availableTrips.map(renderTripCard)
        ) : (
          <Grid item xs={12}>
            <Alert severity="info">No available trips at the moment.</Alert>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard;
