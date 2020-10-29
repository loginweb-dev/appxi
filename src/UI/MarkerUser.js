import React from 'react';
import {
    View,
    StyleSheet,
    Image,
    TouchableOpacity
} from 'react-native';

export default function MarkerUser(props) {
    return (
        <TouchableOpacity onPress={props.onPress} style={{ alignItems: 'center' }}>
            <View style={[styles.container, { backgroundColor: props.color ? props.color : '#156095' }]}>
                <Image
                    style={{ width: 50, height: 50, borderRadius: 25, borderWidth: 3, borderColor: props.color ? props.color : '#156095' }}
                    source={{uri: props.image }}
                />
            </View>
            <View style={[ styles.base, { backgroundColor: props.color ? props.color : '#156095' } ]} />
            <View style={{ height: 5 }} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 50,
        height: 50,
        borderRadius: 25,
        zIndex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    base: {
        transform: [{ rotate: "45deg" }],
        marginTop: -15,
        width: 20,
        height: 20
    }
});