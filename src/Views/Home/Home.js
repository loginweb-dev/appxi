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
    TouchableOpacity,
    TouchableHighlight
} from 'react-native';

import { connect } from 'react-redux';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import ProgressBar from 'react-native-progress/Bar';
import { showMessage } from "react-native-flash-message";
import AwesomeAlert from 'react-native-awesome-alerts';
import { Rating } from 'react-native-ratings';
import io from 'socket.io-client'

//----------------  MAPS ---------------------------------------------------------------
import MapView, { PROVIDER_GOOGLE, Marker, MAP_TYPES } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';


// UI
import CardBorderLeft from "../../UI/CardBorderLeft";
import ClearFix from "../../UI/ClearFix";
import CardCustomerRounded from "../../UI/CardCustomerRounded";
import MarkerUser from "../../UI/MarkerUser";

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

class Home extends Component {
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
            places: [],
            handleDestination: false,
            destination: {
                latitude: env.location.latitude,
                longitude: env.location.longitude,
            },
            driver: {
               latitude: env.location.latitude,
                longitude: env.location.longitude, 
            },
            nearLocation: {},
            searchDestination: false,
            requestTravel: false,
            selectVehicleType: false,
            waitingDriverList: false,
            arrivalTime: '',
            driverList: [],
            waitingForDriver: false,
            setRating: false,
            createLocation: false,
            deleteLocation: false,
            deleteLocationId: 0
        }
        this.getCurrentLocation();

        this.getCustomer();
    }

    getCustomer = () => {
        axios.get(`${env.API}/customers/${this.props.sessionLogin.user.customer.id}?customer_locations.stored=true`)
        .then(res => {
            this.setState({
                places: res.data.customer_locations
            });
        })
        .catch(error => console.log(error))
    }

    componentDidMount() {
        // Detectar keyboard
        Keyboard.addListener('keyboardDidShow', (frames) => this.setState({searchDestination: true}) );
        Keyboard.addListener('keyboardDidHide', () =>  this.setState({searchDestination: false}) );

        // Conectarse al servidor socket-io
        this.socket = io(env.SocketIOServer);
        this.socket.on('chat message', res => {
            this.setState({
                driver: {
                    latitude: res.latitude,
                    longitude: res.longitude
                }
            });
        })
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

    getDestination(location, suggestion = false){
        // Vaciar la ubicación cercana
        this.setState({
            nearLocation: {},
            destination: {
                latitude: location.latitude,
                longitude: location.longitude,
            }
        });

        var nearLocation = null;
        var minDistance = 1;
        // Recorrer todas la ubicaciones guardadas para obtener la más proxima
        this.state.places.map((place) => {
            let distance = this.getDistance(location.latitude, location.longitude, place.latitude, place.longitude);
            if(distance < minDistance){
                minDistance = distance;
                nearLocation = place;
            }
        });

        if(minDistance > 0 && minDistance < 0.2 && !suggestion){
            nearLocation = {
                ...nearLocation,
                distance: minDistance
            }
            this.setState({ nearLocation });
        }else{
            if(!this.state.waitingForDriver){
                this.setState({
                    handleDestination: true,
                    driverList: [],
                    region: {
                        ...this.state.region,
                        latitude: location.latitude,
                        longitude: location.longitude,
                    }
                });
                // Change map center
                setTimeout(() => {
                    this.map.animateToRegion(this.state.region);
                }, 150);
            }
        }
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
        setTimeout(() => {
            this.map.animateToRegion(this.state.region);
        }, 250);
    } 

    async getDrivers(){
        this.setState({
            selectVehicleType: false,
            waitingDriverList: true
        });

        // Simulando generación de lista de conductores
        setTimeout(() => {
            this.setState({
                waitingDriverList: false,
                driverList: drivers
            });

        }, 2000);
    }

    async handleDriver(){
        this.setState({
            requestTravel: false,
            handleDestination: false,
            waitingForDriver: true,
            driverList: [],
            region: {
                ...this.state.region,
                latitude: this.state.location.latitude,
                longitude: this.state.location.longitude,
            },
            driver: {
                latitude: -14.828302,
                longitude: -64.914328
            }
        });
        // Change map center
        setTimeout(() => {
            this.map.animateToRegion(this.state.region);
        }, 250);
        showMessage({
            message: "Viaje aceptado",
            description: "Tu conductor está en camino.",
            type: "success",
            icon: 'success'
        });

        var locationSave = false;
        this.state.places.map((place) => {
            if(place.latitude == this.state.destination.latitude && place.longitude == this.state.destination.longitude){
                locationSave = true;
            }
        });
        
        setTimeout(() => {
            if(!locationSave){
                this.setState({ createLocation: true });
            }
        }, 2500);
    }

    setRatingTravel = () => {
        this.setState({
            requestTravel: false,
            handleDestination: false,
            setRating: false
        });

        showMessage({
            message: "Gracias por tu calificación",
            description: "Con tu calificación nos ayudas a mejorar.",
            type: "success",
            icon: 'success'
        });
    }

    getDistance = function(lat1,lon1,lat2,lon2){
        let rad = x => (x * Math.PI/180);
        let R = 6378.137; //Radio de la tierra en km
        let dLat = rad( lat2 - lat1 );
        let dLong = rad( lon2 - lon1 );
        let a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLong/2) * Math.sin(dLong/2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        let d = R * c;
        return d.toFixed(3);
    }

    handleCreateLocation = () => {
        showMessage({
            message: "Ubicación agregar",
            description: `Se agregó el destino a tu lista de ubicaciones frecuentes.`,
            type: "success",
            icon: 'success'
        });
        this.setState({ createLocation: false })
    }

    handleDeleteLocation = () => {
        var location = {};
        this.state.places.map(place => {
            if(place.id == this.state.deleteLocationId){
                location = place;
            }
        });

        showMessage({
            message: "Ubicación eliminada",
            description: `${location.name} fue eliminada de tu lista de ubicaciones.`,
            type: "info",
            icon: 'info'
        });
        this.setState({ deleteLocation: false })
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
                                setTimeout(() => {
                                    this.map.animateToRegion(this.state.region);
                                }, 250);
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

                {/* My places */}
                {   !this.state.searchDestination && !this.state.requestTravel && !this.state.waitingForDriver &&
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ styles.myPlaces } >
                        {
                            this.state.places.map(place => <Place key={place.id} title={place.title} onPress={() => this.getDestination({latitude: parseFloat(place.latitude), longitude: parseFloat(place.longitude)})} onDelete={() => { this.setState({ deleteLocation: true, deleteLocationId: place.id }) }} />)
                        }
                    </ScrollView>
                }

                {/* Arrival of the driver */}
                {this.state.waitingForDriver && 
                    <View style={ styles.counterContent } >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, color: 'white', marginRight: 5 }}>Llega en </Text>
                        <Text style={ { fontSize: 20, color: 'white' } }>{ this.state.arrivalTime }</Text>
                    </View>
                    </View>
                }

                {   !this.state.searchDestination &&
                    <MapView
                        ref={map => {this.map = map}}
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        initialRegion={this.state.region}
                        onPress={ (event) => this.getDestination(event.nativeEvent.coordinate) }
                    >
                        {/* Marker current location */}
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
                                // onPress={ (event) => this.getDestination(event.nativeEvent.coordinate) }
                            >
                                <Image
                                    source={require('../../assets/images/marker-alt.png')}
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
                                    // console.log('Distance:' + result.distance.toFixed(2) + ' km')
                                    // console.log('Duration:' + result.duration.toFixed(2) + ' min.')
                                    this.setState({requestTravel: true, selectVehicleType: true});
                                }}
                            />
                        }
                        {/* Car driver */}
                        {   this.state.waitingForDriver &&
                            <Marker
                                coordinate={
                                    { 
                                        latitude: this.state.driver.latitude,
                                        longitude: this.state.driver.longitude
                                    }
                                }
                                title='Julia Noa'
                                description='1,3 Km - llega en 7 min'
                            >
                                <MarkerUser image='https://cdn.pixabay.com/photo/2015/09/02/13/24/girl-919048__340.jpg' />
                            </Marker>
                        }
                        {   this.state.waitingForDriver &&
                            <MapViewDirections
                                origin={{ latitude: this.state.location.latitude, longitude: this.state.location.longitude }}
                                language='es'
                                mode='DRIVING'
                                destination={{ latitude: this.state.driver.latitude, longitude: this.state.driver.longitude }}
                                apikey='AIzaSyBGfY28kVR1D4-WK_g_FwXG7bXCHIvpCjQ'
                                strokeWidth = { 4 } 
                                strokeColor = "#156095" 
                                waypoints= {[{ 
                                    latitude: this.state.driver.latitude, longitude: this.state.driver.longitude
                                }]}
                                onReady={ result => this.setState({ arrivalTime: `${result.duration.toFixed(0)} min.` }) }
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
                            <View style={{ alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row' }}>
                                    <TypeVehicleButton onPress={ () => this.getDrivers() } title='Motocicleta' icon='bicycle-sharp' />
                                    <TypeVehicleButton onPress={ () => this.getDrivers() } title='Automóvil' icon='car-sport' />
                                </View>
                                <Text style={{ marginTop: 15, color: 'white' }}>Elije el tipo de transporte que deseas</Text>
                            </View>
                        }
                        {/* ======================= */}

                        {/* Esperando lista de conductores */}
                        {   this.state.waitingDriverList &&
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

                        {/* Set rating */}
                        {   this.state.setRating && 
                            <View style={{ alignItems: 'center', backgroundColor: 'white', borderRadius: 10, paddingTop: 30, width: screenWidth - 100 }}>
                                <Image
                                    style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#156095' }}
                                    source={{uri: 'https://cdn.pixabay.com/photo/2015/09/02/13/24/girl-919048__340.jpg' }}
                                />
                                <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 10 }}>Julia Noe</Text>
                                <Rating
                                    type='star'
                                    startingValue={3}
                                    imageSize={30}
                                    fractions={0}
                                    style={{marginTop: 10}}
                                />
                                <TouchableOpacity
                                    onPress={ this.setRatingTravel }
                                    style={{ width: '100%' }}
                                >
                                    <View style={{ marginTop: 15, paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#CFCFCF', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#156095' }}>Calificar</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        }
                        {/* ======================= */}
                    </View>
                </Modal>

                {/* Change to near location */}
                <AwesomeAlert
                    show={this.state.nearLocation.id ? true : false}
                    showProgress={false}
                    title={`${this.state.nearLocation.name} está a ${(this.state.nearLocation.distance*1000).toFixed(0)} m.`}
                    message="Deseas ir hacia esa ubicación?"
                    closeOnTouchOutside={false}
                    closeOnHardwareBackPress={false}
                    showCancelButton={true}
                    showConfirmButton={true}
                    cancelText="Cancelar"
                    confirmText="Sí, Aceptar"
                    confirmButtonColor="#3184BE"
                    cancelButtonColor="#A2A2A2"
                    onConfirmPressed={ () => this.getDestination({latitude: parseFloat(this.state.nearLocation.latitude), longitude: parseFloat(this.state.nearLocation.longitude)}) }
                    onCancelPressed={() => this.getDestination({latitude: this.state.destination.latitude, longitude: this.state.destination.longitude}, true) }
                />

                {/* Save location */}
                <AwesomeAlert
                    show={ this.state.createLocation }
                    showProgress={true}
                    title={`Agregar ubicación`}
                    message="Deseas agregar el destino a tu lista de ubicaciones frecuentes?"
                    closeOnTouchOutside={false}
                    closeOnHardwareBackPress={false}
                    showCancelButton={true}
                    showConfirmButton={true}
                    cancelText="Cancelar"
                    confirmText="Sí, agregar"
                    confirmButtonColor="#3184BE"
                    cancelButtonColor="#A2A2A2"
                    onConfirmPressed={ this.handleCreateLocation }
                    onCancelPressed={ () => this.setState({ createLocation: false }) }
                />

                {/* Delete save location */}
                <AwesomeAlert
                    show={ this.state.deleteLocation }
                    showProgress={true}
                    title={`Eliminar ubicación`}
                    message="Deseas eliminar la ubicación?"
                    closeOnTouchOutside={false}
                    closeOnHardwareBackPress={false}
                    showCancelButton={true}
                    showConfirmButton={true}
                    cancelText="Cancelar"
                    confirmText="Sí, Eliminar"
                    confirmButtonColor="#C84A28"
                    cancelButtonColor="#A2A2A2"
                    onConfirmPressed={ this.handleDeleteLocation }
                    onCancelPressed={() => this.setState({ deleteLocation: false }) }
                />
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

const Place = (props) => {
    return(
        <View style={{ flexDirection: 'row', borderWidth: 2, borderColor: 'white', borderRadius: 10, marginHorizontal: 2 }}>
            <TouchableHighlight
                onPress={props.onPress}
                style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#156095', borderTopStartRadius: 10, borderBottomStartRadius: 10 }}
            >
                <Text style={{ color: 'white' }}>{ props.title }</Text>
            </TouchableHighlight>
            <TouchableHighlight
                onPress={props.onDelete}
                style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#105280', borderTopEndRadius: 10, borderBottomEndRadius: 10 }}
            >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>x</Text>
            </TouchableHighlight>
        </View>
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
    myPlaces: {
        width: screenWidth,
        position: 'absolute',
        top: 55,
        left: 0,
        right: 0,
        margin: 0,
        zIndex:1
    },
    counterContent: {
        width: screenWidth,
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        margin: 0,
        zIndex:1,
        backgroundColor: '#12486E',
        borderWidth: 2,
        borderColor: 'white',
        borderRadius: 20,
        padding: 20
    }
});

const mapStateToProps = (state) => {
    return {
        sessionLogin: state.sessionLogin,
    }
}

export default connect(mapStateToProps)(Home);