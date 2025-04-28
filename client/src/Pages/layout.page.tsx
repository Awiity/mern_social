import { Outlet } from "react-router";
import NavbarC from "../Components/navbar";

export function Layout() {
    return (
        <>
            <NavbarC />
            <Outlet />
        </>);
}