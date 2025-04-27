import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { DirectionsCar as DirectionsCarIcon } from "@mui/icons-material";
import { fetchMyTrips } from "../redux/slices/tripsSlice";

const MyTripsSidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { myTrips, loading, error } = useSelector((state) => state.trips);

  useEffect(() => {
    dispatch(fetchMyTrips());
  }, [dispatch]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error.detail || "An error occurred"}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        My Trips
      </Typography>
      {myTrips.length > 0 ? (
        <List>
          {myTrips.map((trip) => (
            <ListItem
              key={trip.id}
              button
              onClick={() => navigate(`/trips/${trip.id}`)}
              sx={{
                mb: 1,
                borderRadius: 1,
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <ListItemIcon>
                <DirectionsCarIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={`Trip #${trip.id}`}
                secondary={
                  <>
                    <Typography variant="body2" component="span">
                      {trip.pickup_location} → {trip.dropoff_location}
                    </Typography>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(trip.created_at)}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Alert severity="info">You don't have any assigned trips.</Alert>
      )}
    </Box>
  );
};

export default MyTripsSidebar;
