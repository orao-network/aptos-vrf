import WalletButton from "./WalletButton"

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="container">
                <div className="navbar-brand">
                    <a className="navbar-item">
                        Orao Network
                    </a>
                </div>
                <div className="navbar-menu">

                </div>
                <div className="navbar-end">
                    <div className="navbar-item">
                        <div className="buttons">
                            <WalletButton />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar