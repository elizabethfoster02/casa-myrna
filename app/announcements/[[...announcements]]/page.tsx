"use client";

import Sidebar from "../../components/Sidebar";
import React, { useState, useEffect, ReactElement } from "react";
import AnnouncementsModalButton from "../../components/AnnouncementsModalButton";
import "../../globals.css";
import { ThemeProvider } from "@mui/material/styles";
import theme from "../../theme";

const Announcements: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <Sidebar currentPageComponent={AnnouncementsModalButton} />
    </ThemeProvider>
  );
};

export default Announcements;
