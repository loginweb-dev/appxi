import React, { Component } from 'react';
import {
    View,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text
} from 'react-native';
import axios from 'axios';

// UI
import BackgroundColor from "../../../UI/BackgroundColor";
import TextInputAlt from "../../../UI/TextInputAlt";
import ButtonBlock from "../../../UI/ButtonBlock";
import ClearFix from "../../../UI/ClearFix";

class Register extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: 'percy2020',
            email: 'percy.alvarez.2017@gmail.com',
            password: 'password',
            phone: '59171130523',
            loading: false,
        }
    }

    async newregister(){
        this.setState({loading: true});
        console.log('aka');
        let newdata = {
            username: this.state.username,
            email: this.state.email,
            phone: this.state.phone,
            password: this.state.password
        }
        console.log(newdata);
        const midata = await axios.post('https://appxiapi.loginweb.dev/customers/auth/register', newdata);
        console.log(midata.data);
    }

    render(){
        return (
            <SafeAreaView style={styles.container}>
                <BackgroundColor
                    title='Registrarse'
                    backgroundColor='trabsparent'
                />
                <ScrollView style={{ paddingTop: 20 }} showsVerticalScrollIndicator={false}>
                    <View style={ styles.form }>
                        <TextInputAlt
                            label='Nombre'
                            placeholder='Tu nombre'
                            autoCapitalize='words'
                            value={this.state.username}
                            onChangeText={text => this.setState({email: text})}
                        />
                        <TextInputAlt
                            label='Número de celular'
                            placeholder='Tu número de celular'
                            keyboardType='phone-pad'
                            value={this.state.phone}
                        />
                        <TextInputAlt
                            label='Email'
                            placeholder='Tu email o celular'
                            keyboardType='email-address'
                            value={this.state.email}
                        />
                        <TextInputAlt
                            label='Contraseña'
                            placeholder='Tu contraseña'
                            password
                            value={this.state.password}
                        />
                        <View style={{ margin: 20, marginTop: 30 }}>
                            <ButtonBlock
                                title={this.state.loading ? 'Enviando...' : 'Enviar'}
                                color='white'
                                borderColor='#3b5998'
                                colorText='#3b5998'
                                onPress={() => this.newregister()}
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
        paddingTop: 20,
        backgroundColor: '#fff',
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20
    }
});

export default Register;