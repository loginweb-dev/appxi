import React, { Component } from 'react';
import {
    View,
    StyleSheet,
    Text,
    Image,
    SafeAreaView,
    ScrollView,
    Dimensions,
    Keyboard,
    PermissionsAndroid,
    Modal,
    TouchableOpacity
} from 'react-native';

//----------------  MAPS ---------------------------------------------------------------
import MapView, { PROVIDER_GOOGLE, Marker, MAP_TYPES } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Icon from 'react-native-vector-icons/Ionicons';
import ProgressBar from 'react-native-progress/Bar';

// UI
import CardBorderLeft from "../../UI/CardBorderLeft";
import ClearFix from "../../UI/ClearFix";
import CardCustomerRounded from "../../UI/CardCustomerRounded";
import { Rating } from 'react-native-ratings';

// Config
import { env } from '../../config/env';

const screenWidth = Math.round(Dimensions.get('window').width);
const screenHeight = Math.round(Dimensions.get('window').height);

const drivers = [
    {
        id: 1,
        avatar: 'https://reactnative.dev/img/tiny_logo.png',
        name: 'Julia Smith',
        rating: 4,
        amount: '20',
    },
    {
        id: 2,
        avatar: 'https://reactnative.dev/img/tiny_logo.png',
        name: 'John Doe',
        rating: 3,
        amount: '19',
    },
    {
        id: 3,
        avatar: 'https://reactnative.dev/img/tiny_logo.png',
        name: 'Mark Noel',
        rating: 5,
        amount: '25',
    }
]

export default class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            region: {
                latitude: env.location.latitude,
                longitude: env.location.longitude,
                latitudeDelta: 0.0422,
                longitudeDelta: screenWidth / (screenHeight - 130) * 0.0422
            },
            location: {
                latitude: env.location.latitude,
                longitude: env.location.longitude,
            },
            handleDestination: false,
            destination: {
                latitude: env.location.latitude,
                longitude: env.location.longitude,
            },
            searchDestination: false,
            requestTravel: false,
            selectVehicleType: false,
            waitingDriver: false,
            driverList: []
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
        this.setState({
            handleDestination: true,
            destination: {
                latitude: location.latitude,
                longitude: location.longitude,
            }
        });
    }

    cancelDestination = () => {
        this.setState({
            requestTravel: false,
            handleDestination: false,
            region: {
                ...this.state.region,
                latitude: this.state.location.latitude,
                longitude: this.state.location.longitude,
            }
        });
        // Change map center
        this.map.animateToRegion(this.state.region);
    } 

    async getDrivers(){
        this.setState({
            selectVehicleType: false,
            waitingDriver: true
        });

        // Simulando generación de lista de conductores
        setTimeout(() => {
            this.setState({
                waitingDriver: false,
                driverList: drivers
            });

        }, 3000);
    }

    async handleDriver(){
        this.setState({
            requestTravel: false,
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
                                    },
                                    region: {
                                        ...this.state.region,
                                        latitude: location.lat,
                                        longitude: location.lng,
                                    }
                                });
                                // Change map center
                                this.map.animateToRegion(this.state.region);
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
                                    latitude: this.state.location.latitude,
                                    longitude: this.state.location.longitude
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
                                onPress={ (event) => this.getDestination(event.nativeEvent.coordinate) }
                            >
                                <Image
                                    source={require('../../assets/images/marker.png')}
                                    style={{ width: 40, height: 40 }}
                                />
                            </Marker>
                        }
                        {   this.state.handleDestination &&
                            <MapViewDirections
                                origin={{ latitude: this.state.location.latitude, longitude: this.state.location.longitude }}
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
                                    this.setState({requestTravel: true, selectVehicleType: true});
                                }}
                            />
                        }
                    </MapView>
                }

                {/* Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={this.state.requestTravel}
                    height={screenHeight}
                    onRequestClose={ this.cancelDestination }
                >
                    <View style={ styles.modal }>
                        <View style={{ position: 'absolute', top: 10, right: 10 }}>
                            <TouchableOpacity onPress={ this.cancelDestination }>
                                <Icon name='close-circle-outline' size={50} color='white' />
                            </TouchableOpacity>
                        </View>
                        {/* Seleccionar tipo de vehículo */}
                        {   this.state.selectVehicleType && 
                            <View>
                                <View style={{ flexDirection: 'row' }}>
                                    <TypeVehicleButton onPress={ () => this.getDrivers() } title='Motocicleta' icon='bicycle-sharp' />
                                    <TypeVehicleButton onPress={ () => this.getDrivers() } title='Automóvil' icon='car-sport' />
                                    <TypeVehicleButton onPress={ () => this.getDrivers() } title='Cohete' icon='md-rocket-sharp' />
                                </View>
                                <Text style={{ marginTop: 15, color: 'white' }}>Elije el tipo de transporte que deseas</Text>
                            </View>
                        }
                        {/* ======================= */}

                        {/* Esperando lista de conductores */}
                        {   this.state.waitingDriver &&
                            <View style={{ alignItems: 'center', }}>
                                <View style={{ backgroundColor: 'white', borderRadius: 5 }}>
                                    <ProgressBar indeterminate width={300} color='#156095' />
                                </View>
                                <Text style={{ marginTop: 5, color: 'white' }}>Esperando conductores disponibles</Text>
                            </View>
                        }
                        {/* ======================= */}

                        {/* Lista de conductores */}
                        {
                            this.state.driverList.length > 0 &&
                            <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                <Text style={{ color: 'white', fontSize: 25 }}>Conductores disponibles</Text>
                                <Text style={{ color: 'white', fontSize: 12 }}>Selecciona el conductor que mejor te convenga</Text>
                            </View>
                        }
                        {
                            this.state.driverList.map(driver =>
                                <CardCustomerRounded
                                    key={driver.id}
                                    avatar={driver.avatar}
                                    name={driver.name}
                                    rating={driver.rating}
                                    amount={driver.amount}
                                    onPress={() => this.handleDriver()}
                                />
                            )
                        }
                        {/* ======================= */}
                    </View>
                </Modal>
            </SafeAreaView>
        )
    }
}

const TypeVehicleButton = (props) => {
    return(
        <TouchableOpacity
            onPress={props.onPress}
            style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', height: 60, width: 80, borderWidth: 1, borderColor: '#959595', }}
        >
            <Icon name={props.icon} size={30} />
            <Text style={{ fontSize: 10 }}>{props.title}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        marginTop: 50,
        height: screenHeight-180,
        width: screenWidth,
    },
    modal: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        backgroundColor: 'rgba(0,0,0,0.4)'
    },
});