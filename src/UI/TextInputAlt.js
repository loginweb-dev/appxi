import React from 'react';
import {
    View,
    StyleSheet,
    Text,
    TextInput
} from 'react-native';

export default function TextInputAlt(props) {
    return (
        <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
            <View style={{ width: '100%' }}>
                <Text style={{ color: '#B7B7B7', fontWeight: 'bold' }}>{props.label}</Text>
                <TextInput
                    style={{ height: 40, borderColor: '#C4C4C4', borderBottomWidth: 2, fontWeight: 'bold' }}
                    placeholder={props.placeholder}
                    placeholderTextColor='#C4C4C4'
                    secureTextEntry={props.password ? true: false}
                    keyboardType={props.keyboardType ? props.keyboardType : 'default'}
                    autoCapitalize={props.autoCapitalize ? props.autoCapitalize : 'none'}
                    value={props.value}
                    onChangeText={props.onChangeText}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    
});