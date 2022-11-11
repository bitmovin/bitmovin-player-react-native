
extension UIView {
    /// Traverse a UIresponder's view hierarchy in the same way as the Debug View Hierarchy tool in Xcode.
    ///
    /// `traverseHierarchy` uses Depth First Search (DFS) to traverse the view hierarchy starting in the window. This way the method can traverse all sub-hierarchies in a correct order.
    ///
    /// - parameters:
    ///     - visitor: The closure executed for every view object in the hierarchy
    ///     - responder: The view object, `UIView`, `UIViewController`, or `UIWindow` instance.
    ///     - level: The depth level in the view hierarchy.
    func traverseHierarchy(_ visitor: (_ responder: UIResponder, _ level: Int) -> Void) {
        /// Stack used to accumulate objects to visit.
        var stack: [(responder: UIResponder, level: Int)] = [(responder: self, level: 0)]

        while !stack.isEmpty {
            let current = stack.removeLast()

            // Push objects to visit on the stack depending on the current object's type.
            switch current.responder {
                case let view as UIView:
                    // For `UIView` object push subviews on the stack following next rules:
                    //      - Exclude hidden subviews;
                    //      - If the subview is the root view in the view controller - take the view controller instead.
                    stack.append(contentsOf: view.subviews.reversed().compactMap {
                        $0.isHidden ? nil : (responder: $0.next as? UIViewController ?? $0, level: current.level + 1)
                    })

                case let viewController as UIViewController:
                    // For `UIViewController` object push it's view. Here the view is guaranteed to be loaded and in the window.
                    stack.append((responder: viewController.view, level: current.level + 1))

                default:
                    break
            }

            // Visit the current object
            visitor(current.responder, current.level)
        }
    }
}
