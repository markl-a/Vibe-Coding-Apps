import SwiftUI

struct FilterPickerView: View {
    @Binding var selection: FilterOption

    var body: some View {
        Picker("篩選", selection: $selection) {
            ForEach(FilterOption.allCases) { option in
                Label(option.rawValue, systemImage: option.icon)
                    .tag(option)
            }
        }
        .pickerStyle(.segmented)
    }
}

#Preview {
    FilterPickerView(selection: .constant(.all))
        .padding()
}
