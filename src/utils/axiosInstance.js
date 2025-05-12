import axios from "axios";
import { API_BASE_URL } from "../config/env";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

export default axiosInstance;
