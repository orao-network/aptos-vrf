import Head from "next/head";
import { ReactNode } from "react";
import Navbar from "./Navbar";

type Props = {
    children?: ReactNode,
    title?: string,
}

const Layout = ({ children, title = "This is the default title" }: Props) => {
    return (
        <>
            <Head>
                <title>{title}</title>
                <meta charSet="utf-8" />
                <meta name="viewport" content="initial-scale=1.0, width=device-width" />
            </Head>
            <Navbar />
            {children}
        </>
    )
}

export default Layout;