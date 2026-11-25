import { useEffect } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import MR from "./C/MR";
import L from "./C/L";
import { lazy } from "react";
import CB from "./C/CB";
import { A } from "./hooks/A";

const Home = lazy(() => import("./pages/home"));
const Nades = lazy(() => import("./pages/nades"));
const Collections = lazy(() => import("./pages/collections"));
const Profile = lazy(() => import("./pages/profile"));
const Matches = lazy(() => import("./pages/matches"));
const UserMatchDetail = lazy(() => import("./C/UMD"));
const Challenges = lazy(() => import("./pages/challenges"));
const Upgrade = lazy(() => import("./pages/upgrade"));
const Privacy = lazy(() => import("./pages/privacy"));
const Terms = lazy(() => import("./pages/terms"));
const MC = lazy(() => import("./pages/mycollections"));
const Pro = lazy(() => import("./pages/pro"));
const ProTournament = lazy(() => import("./pages/proTournament"));
const ProTeam = lazy(() => import("./pages/proTeam"));
const ProPlayer = lazy(() => import("./pages/proPlayer"));
const ProTeamAll = lazy(() => import("./pages/proTeamAll"));
const NotFound = lazy(() => import("./pages/notfound"));

const router = createBrowserRouter([
  {
    element: <L />,
    children: [
      { index: true, element: <Home /> },
      { path: "nades", element: <Nades /> },
      { path: "collections", element: <Collections /> },
      { path: "challenges", element: <Challenges /> },
      { path: "profile/*", element: <Profile /> },
      { path: "matches", element: <Matches /> },
      { path: "matches/:matchId", element: <UserMatchDetail /> },
      { path: "upgrade", element: <Upgrade /> },
      { path: "mycollections", element: <MC /> },
      { path: "pro", element: <Pro /> },
      { path: "pro/players/:playerSlug", element: <ProPlayer /> },
      { path: "pro/teams/:teamSlug", element: <ProTeamAll /> },
      { path: "pro/:tournamentSlug", element: <ProTournament /> },
      { path: "pro/:tournamentSlug/:teamSlug", element: <ProTeam /> },
      { path: "pro/:tournamentSlug/:teamSlug/:playerSlug", element: <ProPlayer /> },
      { path: "privacy-policy", element: <Privacy /> },
      { path: "terms-of-service", element: <Terms /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

const STORAGE_KEY = "analyticsConsent";

function App() {
  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (accepted === "true") {
      A();
    }
  }, []);

  return (
    <MR>
      <RouterProvider router={router} />
      <CB onAccept={A} />
    </MR>
  );
}

export default App;