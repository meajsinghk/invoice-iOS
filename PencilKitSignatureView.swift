import SwiftUI
import PencilKit

// MARK: - PencilKit Signature View (UIViewRepresentable)

struct SignatureCanvasView: UIViewRepresentable {
    @Binding var drawing: PKDrawing
    var backgroundColor: UIColor = .systemBackground

    func makeUIView(context: Context) -> PKCanvasView {
        let canvas = PKCanvasView()
        canvas.drawing = drawing
        canvas.drawingPolicy = .anyInput   // accept finger + Apple Pencil
        canvas.backgroundColor = backgroundColor
        canvas.delegate = context.coordinator
        canvas.tool = PKInkingTool(.pen, color: .label, width: 2)
        canvas.overrideUserInterfaceStyle = .light
        return canvas
    }

    func updateUIView(_ uiView: PKCanvasView, context: Context) {
        if uiView.drawing != drawing {
            uiView.drawing = drawing
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(drawing: $drawing)
    }

    class Coordinator: NSObject, PKCanvasViewDelegate {
        @Binding var drawing: PKDrawing

        init(drawing: Binding<PKDrawing>) {
            _drawing = drawing
        }

        func canvasViewDrawingDidChange(_ canvasView: PKCanvasView) {
            drawing = canvasView.drawing
        }
    }
}

// MARK: - Signature Pad SwiftUI Wrapper

struct SignaturePadView: View {
    @Binding var drawing: PKDrawing

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Signature")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                Button {
                    drawing = PKDrawing()
                } label: {
                    Label("Clear", systemImage: "arrow.counterclockwise")
                        .font(.caption)
                        .foregroundStyle(.red)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(.ultraThinMaterial)

            SignatureCanvasView(drawing: $drawing, backgroundColor: .secondarySystemBackground)
                .frame(height: 140)
                .clipShape(RoundedRectangle(cornerRadius: 0))

            HStack {
                Spacer()
                Text("Draw your signature above")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                Spacer()
            }
            .padding(.vertical, 6)
            .background(Color(.secondarySystemBackground))
        }
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color(.separator), lineWidth: 0.5)
        )
    }
}

// MARK: - Drawing → PNG Data

extension PKDrawing {
    /// Renders the drawing to PNG Data at a given scale.
    func pngData(scale: CGFloat = 2.0, size: CGSize = CGSize(width: 400, height: 140)) -> Data? {
        let bounds = self.bounds.isEmpty
            ? CGRect(origin: .zero, size: size)
            : self.bounds.insetBy(dx: -10, dy: -10)

        let image = self.image(from: bounds, scale: scale)
        return image.pngData()
    }
}
