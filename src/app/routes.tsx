import { createBrowserRouter } from "react-router";
import Home from "./pages/Home";
import CalligraphyGallery from "./pages/CalligraphyGallery";
import CalligraphyDetail from "./pages/CalligraphyDetail";
import DesignGallery from "./pages/DesignGallery";
import DesignDetail from "./pages/DesignDetail";
import PosterGallery from "./pages/PosterGallery";
import PosterDetail from "./pages/PosterDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/posters",
    Component: PosterGallery,
  },
  {
    path: "/poster/:id",
    Component: PosterDetail,
  },
  {
    path: "/calligraphy",
    Component: CalligraphyGallery,
  },
  {
    path: "/calligraphy/:style/:id",
    Component: CalligraphyDetail,
  },
  {
    path: "/design",
    Component: DesignGallery,
  },
  {
    path: "/design/:category/:id",
    Component: DesignDetail,
  },
]);
