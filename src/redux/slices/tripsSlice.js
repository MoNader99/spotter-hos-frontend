import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../../config/env";

// Create axios instance with auth header
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Function to get the token from Redux state
const getAuthToken = (state) => state.auth.token;

export const fetchAvailableTrips = createAsyncThunk(
  "trips/fetchAvailableTrips",
  async (_, { getState }) => {
    const token = getState().auth.token;
    const response = await axiosInstance.get("/trips/available/", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  }
);

export const fetchMyTrips = createAsyncThunk(
  "trips/fetchMyTrips",
  async (_, { getState }) => {
    const token = getState().auth.token;
    const response = await axiosInstance.get("/trips/my-trips/", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  }
);

export const fetchTripDetails = createAsyncThunk(
  "trips/fetchTripDetails",
  async (tripId, { getState }) => {
    const token = getState().auth.token;
    const response = await axiosInstance.get(`/trips/${tripId}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  }
);

export const fetchTripRoute = createAsyncThunk(
  "trips/fetchTripRoute",
  async (tripId, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState());
      const response = await axiosInstance.get(`/trips/${tripId}/route/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const assignTrip = createAsyncThunk(
  "trips/assignTrip",
  async (tripId, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState());
      const response = await axiosInstance.post(
        `/trips/${tripId}/assign/`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const addTripLog = createAsyncThunk(
  "trips/addTripLog",
  async ({ tripId, logData }, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState());
      const response = await axiosInstance.post(
        `/trips/${tripId}/add-log/`,
        logData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const completeTrip = createAsyncThunk(
  "trips/completeTrip",
  async (tripId, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState());
      const response = await axiosInstance.post(
        `/trips/${tripId}/complete/`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  availableTrips: [],
  myTrips: [],
  currentTrip: null,
  tripRoute: null,
  loading: false,
  error: null,
};

const tripsSlice = createSlice({
  name: "trips",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTrip: (state) => {
      state.currentTrip = null;
      state.tripRoute = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Available Trips
      .addCase(fetchAvailableTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.availableTrips = action.payload;
      })
      .addCase(fetchAvailableTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch My Trips
      .addCase(fetchMyTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.myTrips = action.payload;
      })
      .addCase(fetchMyTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Trip Details
      .addCase(fetchTripDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTripDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTrip = action.payload;
      })
      .addCase(fetchTripDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Trip Route
      .addCase(fetchTripRoute.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTripRoute.fulfilled, (state, action) => {
        state.loading = false;
        state.tripRoute = action.payload;
      })
      .addCase(fetchTripRoute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Assign Trip
      .addCase(assignTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTrip = action.payload;
      })
      .addCase(assignTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Trip Log
      .addCase(addTripLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTripLog.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentTrip) {
          state.currentTrip.logs = [...state.currentTrip.logs, action.payload];
        }
      })
      .addCase(addTripLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Complete Trip
      .addCase(completeTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTrip = action.payload;
      })
      .addCase(completeTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentTrip } = tripsSlice.actions;
export default tripsSlice.reducer;
