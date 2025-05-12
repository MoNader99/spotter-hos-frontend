import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Grid,
  CircularProgress,
} from "@mui/material";
import { createTrip, fetchMyTrips } from "../redux/slices/tripsSlice";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const MapComponent = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

const CreateTrip = () => {
  const [formData, setFormData] = useState({
    pickup_location: "",
    dropoff_location: "",
    current_location: "",
  });
  const [pickupPosition, setPickupPosition] = useState(null);
  const [dropoffPosition, setDropoffPosition] = useState(null);
  const [isSelectingPickup, setIsSelectingPickup] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { error } = useSelector((state) => state.trips);
  const { user } = useSelector((state) => state.auth);

  const getLocationName = async (latlng) => {
    try {
      setGeocodingLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&zoom=10&addressdetails=1`
      );
      const data = await response.json();

      // Extract city and state
      let city = "";
      let state = "";

      if (data.address) {
        // Try to get city name
        if (data.address.city) {
          city = data.address.city;
        } else if (data.address.town) {
          city = data.address.town;
        } else if (data.address.village) {
          city = data.address.village;
        } else if (data.address.county) {
          city = data.address.county;
        }

        // Get state
        if (data.address.state) {
          state = data.address.state;
        }
      }

      // If we have both city and state, format as "City, State"
      if (city && state) {
        return `${city}, ${state}`;
      }

      // If we only have state, use it
      if (state) {
        return state;
      }

      // If we only have city, use it
      if (city) {
        return city;
      }

      // Fallback to first part of display name
      return data.display_name.split(",")[0];
    } catch (error) {
      console.error("Error getting location name:", error);
      return `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handleLocationSelect = async (latlng) => {
    const locationName = await getLocationName(latlng);

    if (isSelectingPickup) {
      setPickupPosition(latlng);
      setFormData((prev) => ({
        ...prev,
        pickup_location: locationName,
        current_location: locationName,
      }));
    } else {
      setDropoffPosition(latlng);
      setFormData((prev) => ({
        ...prev,
        dropoff_location: locationName,
      }));
    }
    setIsSelectingPickup(!isSelectingPickup);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!pickupPosition) {
      newErrors.pickup_position = "Please select pickup location on map";
    }
    if (!dropoffPosition) {
      newErrors.dropoff_position = "Please select dropoff location on map";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      const tripData = {
        ...formData,
        pickup_coordinates: [pickupPosition.lat, pickupPosition.lng],
        dropoff_coordinates: [dropoffPosition.lat, dropoffPosition.lng],
        auto_assign: user?.role === "driver",
      };
      const result = await dispatch(createTrip(tripData));
      setLoading(false);
      if (!result.error) {
        await dispatch(fetchMyTrips());
        navigate("/");
      }
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Trip
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error.detail || "An error occurred"}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Pickup Location"
                name="pickup_location"
                value={formData.pickup_location}
                InputProps={{ readOnly: true }}
                error={!!errors.pickup_position}
                helperText={
                  errors.pickup_position ||
                  "Click on map to select pickup location"
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Dropoff Location"
                name="dropoff_location"
                value={formData.dropoff_location}
                InputProps={{ readOnly: true }}
                error={!!errors.dropoff_position}
                helperText={
                  errors.dropoff_position ||
                  "Click on map to select dropoff location"
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Select Locations on Map
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {isSelectingPickup
                  ? "Click on the map to set pickup location (blue marker)"
                  : "Click on the map to set dropoff location (red marker)"}
              </Typography>
              <Box
                sx={{ height: 400, width: "100%", mb: 2, position: "relative" }}
              >
                {geocodingLoading && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      zIndex: 1000,
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      padding: 2,
                      borderRadius: 1,
                    }}
                  >
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Getting location name...
                    </Typography>
                  </Box>
                )}
                <MapContainer
                  center={[39.8283, -98.5795]}
                  zoom={4}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  {pickupPosition && (
                    <Marker
                      position={pickupPosition}
                      icon={L.divIcon({
                        className: "custom-icon",
                        html: `<div style="background-color: #1976d2; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
                      })}
                    />
                  )}
                  {dropoffPosition && (
                    <Marker
                      position={dropoffPosition}
                      icon={L.divIcon({
                        className: "custom-icon",
                        html: `<div style="background-color: #d32f2f; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
                      })}
                    />
                  )}
                  <MapComponent onLocationSelect={handleLocationSelect} />
                </MapContainer>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || geocodingLoading}
              >
                {loading ? "Creating..." : "Create Trip"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateTrip;
