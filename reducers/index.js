const reducerApp = (
        state = {
            sessionLogin: {}
        }, action
    ) => {
    switch (action.type) {
        case 'SET_SESSIONLOGIN':
            return {...state, sessionLogin: action.payload};
        default:
            return state;
    }
}

export default reducerApp;