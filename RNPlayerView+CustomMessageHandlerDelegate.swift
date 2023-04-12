//
//  RNPlayerView+CustomMessageHandlerDelegate.swift
//  Pods
//
//  Created by Daniel Comes on 12/04/2023.
//

import BitmovinPlayer

extension RNPlayerView: CustomMessageHandlerDelegate {
    func receivedAsynchronousMessage(_ message: String, withData data: String?) {
        onReceivedAsynchronousMessage?(["message": message, "data": data])
    }
    
    func receivedSynchronousMessage(_ message: String, withData data: String?) -> String? {
        guard let data = data else {
            return "No data received for message: \(message)"
        }
        
        let messageData = ["message": message, "data": data]
        onReceivedSynchronousMessage?(messageData)
        
        return "Received message with data: \(messageData)"
    }
}
