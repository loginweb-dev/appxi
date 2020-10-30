import React, { Component } from 'react';
import {
    View,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import { connect } from 'react-redux';
import axios from "axios";
import { showMessage } from "react-native-flash-message";

// Firebase
import auth from '@react-native-firebase/auth';
import { LoginManager, AccessToken } from 'react-native-fbsdk';
import { GoogleSignin } from '@react-native-community/google-signin';

// UI
import BackgroundColor from "../../../UI/BackgroundColor";
import TextInputAlt from "../../../UI/TextInputAlt";
import ButtonBlock from "../../../UI/ButtonBlock";
import ClearFix from "../../../UI/ClearFix";

// Config
import { env } from '../../../config/env';

GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    webClientId: '932613022200-34onbha0rj13ef7gkl8kvoldtrea7gm4.apps.googleusercontent.com',
    offlineAccess: true,
    forceCodeForRefreshToken: true,
});

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            typeLogin: '',
            userInfo: {}
        }
    }

    onFacebookButtonPress = async () => {

        this.setState({typeLogin: 'facebook'});
        // Attempt login with permissions
        const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

        if (result.isCancelled) {
            throw 'User cancelled the login process';
        }

        // Once signed in, get the users AccesToken
        AccessToken.getCurrentAccessToken()
        .then((data) => {
            const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);
            // Sign-in the user with the credential
            auth().signInWithCredential(facebookCredential);

            // Get information from Facebook API 
            fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${data.accessToken}`)
            .then(res => res.json())
            .then(res => {

                this.setState({
                    email: res.email ? res.email : `${res.id}@loginweb.dev`,
                    password: 'password',
                    userInfo: {
                        name: res.name,
                        email: res.email ? res.email : `${res.id}@loginweb.dev`,
                        avatar: `http://graph.facebook.com/${res.id}/picture?type=large`,
                        type: 'facebook'
                    }
                });
                this.handleLogin()
            })
            .catch(error => {
                console.log(error);
            })
        })
    }

    onGoogleButtonPress = async () => {
        this.setState({typeLogin: 'google'});
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            this.setState({
                email: userInfo.user.email,
                password: 'password'
            });
            this.handleLogin()
        } catch (error) {
            console.log(error)
        }
    }

    handleLogin = async () => {

        if(this.state.email && this.state.password){
            let url = `${env.API}/auth/local`;
            let credential = {
                identifier: this.state.email,
                password: this.state.password
            }
            let res = await axios.post(url, credential)
                            .then(res => res.data)
                            .catch(error => null);

            if(res){
                let miavatar = res.user.customer.avatar ? res.user.customer.avatar.url : null;
                let user = {
                    id: res.user.id,
                    name: res.user.first_name,
                    last_name: res.user.last_name,
                    email: res.user.email,
                    codePhone: '+591',
                    numberPhone: res.user.phone,
                    avatar: `https://appxiapi.loginweb.dev${miavatar}`,
                    type: 'dashboard',
                    jwt: res.user.jwt
                }
                this.successLogin(user);
                
            }else{
                if(this.state.typeLogin != 'dashboard'){
                    let url = `${env.API}/users`;
                    let credential = {
                        username: this.state.userInfo.name,
                        email: this.state.userInfo.email,
                        password: 'password',
                        confirmed: true
                    }
                    axios.post(url, credential)
                    .then(res => {
                        let user = res.data;
                        let url = `${env.API}/customers`;
                        let customer = {
                            first_name: this.state.userInfo.name,
                            user_id: user.id
                        }
                        axios.post(url, customer)
                        .then(res => {
                            let customer = res.data;
                            let miavatar = customer.avatar ? customer.avatar.url : null;
                            let user = {
                                id: customer.user_id.id,
                                name: customer.first_name,
                                last_name: customer.last_name,
                                email: customer.user_id.email,
                                codePhone: '+591',
                                numberPhone: customer.user_id.phone,
                                avatar: `https://appxiapi.loginweb.dev${miavatar}`,
                                type: 'facebook',
                                // jwt: res.user.jwt
                            }
                            this.successLogin(user);
                        })
                        .catch(error => console.log(error))
                    })
                    .catch(error => console.log(error))

                }else{
                    showMessage({
                        message: "Credenciales incorrectos",
                        description: "Su email y/o contrasela no están registrados.",
                        type: "warning",
                        icon: 'warning'
                    });
                }
            }
        }else{
            showMessage({
                message: "Error de validación",
                description: "Debe ingresar un email y contraseña válidos.",
                type: "warning",
                icon: 'warning'
            });
        }
    }

    successLogin(user){
        this.props.setUser(user);
        AsyncStorage.setItem('SessionUser', JSON.stringify(user));
        this.props.navigation.reset({
            index: 0,
            routes: [{ name: 'TabMenu' }],
            key: null,
        });
    }

    render(){
        return (
            <SafeAreaView style={styles.container}>
                <BackgroundColor
                    title='Login'
                    backgroundColor='transparent'
                />
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={ styles.form }>
                        <TextInputAlt
                            label='Email'
                            placeholder='Tu email o celular'
                            keyboardType='email-address'
                            // value={ this.state.email }
                            onChangeText={ text => this.setState({email: text}) }
                        />
                        <TextInputAlt
                            label='Contraseña'
                            placeholder='Tu contraseña'
                            password
                            // value={ this.state.password }
                            onChangeText={ text => this.setState({password: text}) }
                        />
                        <View style={{ margin: 20 }}>
                            <ButtonBlock
                                title='Iniciar sesión'
                                color='white'
                                borderColor='#3b5998'
                                colorText='#3b5998'
                                onPress={ () => {
                                    this.setState({
                                        typeLogin: 'dashboard'
                                    });
                                    this.handleLogin();
                                } }
                            />
                        </View>
                        <View style={{ alignItems: 'center', width: '100%' }}>
                            <Text style={{ color: '#B7B7B7' }}>O inicia sesión con tus redes sociales</Text>
                        </View>
                        <View style={{ padding: 30, paddingTop: 20}}>
                            <ButtonBlock
                                icon='ios-logo-facebook'
                                title='Login con Facebook'
                                color='#3b5998'
                                onPress={ this.onFacebookButtonPress }
                            />
                            <ButtonBlock
                                icon='ios-logo-google'
                                title='Login con Google'
                                color='red'
                                onPress={ this.onGoogleButtonPress }
                            />
                            <ButtonBlock
                                title='Registrarse'
                                color='transparent'
                                colorText='#45A4C0'
                                style={{ marginTop: 15 }}
                                onPress={() => this.props.navigation.navigate('Register')}
                            />
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2A80DB'
    },
    form:{
        flex: 1,
        paddingTop: 20,
        backgroundColor: '#fff',
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20
    }
});

const mapDispatchToProps = (dispatch) => {
    return {
        setUser : (user) => dispatch({
            type: 'SET_USER',
            payload: user
        })
    }
}

export default connect(null, mapDispatchToProps)(Login);