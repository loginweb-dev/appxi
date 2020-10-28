import React, { Component } from 'react';
import { View, StyleSheet, Text, Image, SafeAreaView, ScrollView, Dimensions, Keyboard, PermissionsAndroid } from 'react-native';

//----------------  MAPS ---------------------------------------------------------------
import MapView, { PROVIDER_GOOGLE, Marker, MAP_TYPES } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

// UI
import CardBorderLeft from "../../UI/CardBorderLeft";
import ClearFix from "../../UI/ClearFix";

// Config
import { env } from '../../config/env';

const screenWidth = Math.round(Dimensions.get('window').width);
const screenHeight = Math.round(Dimensions.get('window').height);

export default class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            initialLat : env.location.latitude,
            initialLon: env.location.longitude,
            region: {
                latitude: env.location.latitude,
                longitude: env.location.longitude,
                latitudeDelta: 0.0422,
                longitudeDelta: screenWidth / (screenHeight - 130) * 0.0422
            },
            handleDestination: false,
            destination: {
                latitude: env.location.latitude,
                longitude: env.location.longitude,
            },
            searchDestination: false
        }
        this.getCurrentLocation();
    }

    componentDidMount() {
        // Detectar keyboard
        Keyboard.addListener('keyboardDidShow', (frames) => this.setState({searchDestination: true}) );
        Keyboard.addListener('keyboardDidHide', () =>  this.setState({searchDestination: false}) );
    }

    async getCurrentLocation(){
        try {
            const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                'title': 'Permiso de ubicación',
                'message': `${env.appName} necesita acceder a tu ubicación actual.`
                }
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                Geolocation.getCurrentPosition(position => {
                    this.setState({
                        region: {
                            ...this.state.region,
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        }
                    });
                },
                error => console.log(error),
                {
                    enableHighAccuracy: false,
                    timeout: 2000,
                    maximumAge: 3600000
                });
            }
        } catch (err) {
            console.log(err)
        }
    }

    getDestination(location){
        console.log(location)
        this.setState({
            handleDestination: true,
            destination: {
                latitude: location.latitude,
                longitude: location.longitude,
            }
        });
    }
 
    render(){
        return (
            <SafeAreaView style={ styles.container }>
                <GooglePlacesAutocomplete
                    placeholder='Buscar ubicación...'
                    minLength={2}
                    autoFocus={false}
                    returnKeyType={'default'}
                    onPress={(data, details = null) => {
                        if(data && details){
                            fetch(`https://maps.googleapis.com/maps/api/place/details/json?placeid=${data.place_id}&key=AIzaSyDZxHrC2bzBBqjS8iYctd6D_FzTJmqUtoY`)
                            .then(res => res.json())
                            .then(res => {
                                let location = res.result.geometry.location;
                                console.log(location)
                                this.setState({
                                    handleDestination: true,
                                    destination: {
                                        latitude: location.lat,
                                        longitude: location.lng,
                                    }
                                });
                            })
                            .catch(error => {
                                console.log(error)
                            })
                        }
                    }}
                    query={{
                        key: 'AIzaSyDZxHrC2bzBBqjS8iYctd6D_FzTJmqUtoY',
                        language: 'es',
                    }}
                />
                
                {   !this.state.searchDestination &&
                    <MapView
                        ref={map => {this.map = map}}
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        initialRegion={this.state.region}
                        onPress={ (event) => this.getDestination(event.nativeEvent.coordinate) }
                    >
                        <Marker
                            coordinate={
                                { 
                                    latitude: this.state.region.latitude,
                                    longitude: this.state.region.longitude
                                }
                            }
                            title='Location'
                            description='Location description'
                            opacity={1}
                        >
                            <Image
                                source={require('../../assets/images/marker.png')}
                                style={{ width: 40, height: 40 }}
                            />

                        {/* Marker destination */}
                        </Marker>
                        {   this.state.handleDestination &&
                            <Marker
                                coordinate={
                                    { 
                                        latitude: this.state.destination.latitude,
                                        longitude: this.state.destination.longitude
                                    }
                                }
                                title='Destino'
                                description='Location description'
                                // draggable
                                opacity={1}
                            >
                                <Image
                                    source={require('../../assets/images/marker.png')}
                                    style={{ width: 40, height: 40 }}
                                />
                            </Marker>
                        }
                        {   this.state.handleDestination &&
                            <MapViewDirections
                                origin={{ latitude: this.state.region.latitude, longitude: this.state.region.longitude }}
                                language='es'
                                mode='DRIVING'
                                destination={{ latitude: this.state.destination.latitude, longitude: this.state.destination.longitude }}
                                apikey='AIzaSyBGfY28kVR1D4-WK_g_FwXG7bXCHIvpCjQ'
                                strokeWidth = { 4 } 
                                strokeColor = "#156095" 
                                waypoints= {[{ 
                                    latitude: this.state.destination.latitude, longitude: this.state.destination.longitude
                                }]}
                                onReady={result => {
                                    console.log('Distance:' + result.distance.toFixed(2) + ' km')
                                    console.log('Duration:' + result.duration.toFixed(2) + ' min.')
                                }}
                            />
                        }
                    </MapView>
                }
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        marginTop: 50,
        height: screenHeight-50,
        width: screenWidth,
    },
});