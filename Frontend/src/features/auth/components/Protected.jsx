import { useAuth } from "../hooks/useAuth";
import { Navigate } from 'react-router';


const Protected = ({children}) => {

    const { user, authReady } = useAuth()
    

    if (!authReady) {
        return (<main> <h1>Checking your session...</h1> </main>)
    }

    if (!user) {
        return <Navigate to={"/login"} />
    }

    return children
}

export default Protected