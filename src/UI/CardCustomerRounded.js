import React from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Text,
    Image
} from 'react-native';
import { Rating } from 'react-native-ratings';

export default function CardCustomerRounded(props) {
    return (
        <TouchableOpacity
            onPress={props.onPress}
        >
            <View style={ [styles.cardContainer] }>
                <View style={{ width: '20%', flex: 1 }}>
                    <Image
                        style={{ width: 50, height: 50, borderRadius: 25 }}
                        source={{uri: props.avatar }}
                    />
                </View>
                <View style={{ width: '60%' }}>
                    <Text style={{ fontSize: 18, color: 'black' }} numberOfLines={1}>{ props.name }</Text>
                    <Rating
                        type='star'
                        startingValue={props.rating}
                        readonly
                        imageSize={15}
                        style={{flexDirection: 'row'}}
                    />
                </View>
                <View style={{ width: '20%', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, color: '#5B5C5E' }}>{ props.amount } Bs.</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        flexDirection: 'row',
        borderWidth: 1,
        borderBottomWidth: 0,
        backgroundColor: 'white',
        shadowColor: '#ddd',
        shadowOffset: { width: 0, height: 3 },
        borderRadius: 25,
        shadowOpacity: 0.8,
        shadowRadius: 2,
        height: 50,
        width: '100%',
        elevation: 3,
        borderColor: '#ddd',
        marginTop: 5
    }
});