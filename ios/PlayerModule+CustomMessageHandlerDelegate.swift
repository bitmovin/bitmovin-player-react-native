import BitmovinPlayer


extension PlayerModule: CustomMessageHandlerDelegate {
    func receivedSynchronousMessage(_ message: String, withData data: String?) -> String? {
        if message != nil {
//            how to access view property metod?
//            onReceivedSynchronousMessage?(["message": message, "data": data ?? ""])
        }
        return nil
    }

    func receivedAsynchronousMessage(_ message: String, withData data: String?) {
        if message != nil {
//            how to access view property metod?
//            onReceivedAsynchronousMessage?(["message": message, "data": data ?? ""])
        }
    }
}
