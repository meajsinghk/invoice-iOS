import Foundation
import SwiftData

// MARK: - Company Profile Model (singleton — one record per install)

@Model
class CompanyProfile {
    var id: UUID
    var companyName: String
    var businessTagline: String
    var businessServices: String
    var addressLine1: String
    var addressLine2: String
    var companyGSTIN: String
    var companyPAN: String
    var companyPhone: String
    var bankNameAndBranch: String
    var bankAccountNo: String
    var bankIFSCCode: String
    var termsAndConditionsData: Data   // JSON-encoded [String]
    var authorizedSignatoryName: String

    var termsAndConditions: [String] {
        get { (try? JSONDecoder().decode([String].self, from: termsAndConditionsData)) ?? CompanyProfile.defaultTerms }
        set { termsAndConditionsData = (try? JSONEncoder().encode(newValue)) ?? Data() }
    }

    static let defaultTerms: [String] = [
        "Certified that the particulars given above are true and correct.",
        "E.&O.E.",
        "Subject to Gwalior jurisdiction only.",
        "Goods once sold will not be taken back."
    ]

    init(
        id: UUID = UUID(),
        companyName: String = "MILAN CONSTRUCTION",
        businessTagline: String = "WORK CONTRACTOR & CIVIL CONTRACTOR",
        businessServices: String = "ALL TYPES OF EARTH WORK & CIVIL MAINTENANCE WORKS",
        addressLine1: String = "Manpura, Village Jalalpur",
        addressLine2: String = "Morena Road Gwalior, Madhya Pradesh, India 474010",
        companyGSTIN: String = "23AWKPV3941M1ZY",
        companyPAN: String = "AWKP3941M",
        companyPhone: String = "+917770855666",
        bankNameAndBranch: String = "HDFC BANK GWALIOR",
        bankAccountNo: String = "50200048493635",
        bankIFSCCode: String = "HDFC0003707",
        termsAndConditions: [String] = CompanyProfile.defaultTerms,
        authorizedSignatoryName: String = "Milandeep Virk"
    ) {
        self.id = id
        self.companyName = companyName
        self.businessTagline = businessTagline
        self.businessServices = businessServices
        self.addressLine1 = addressLine1
        self.addressLine2 = addressLine2
        self.companyGSTIN = companyGSTIN
        self.companyPAN = companyPAN
        self.companyPhone = companyPhone
        self.bankNameAndBranch = bankNameAndBranch
        self.bankAccountNo = bankAccountNo
        self.bankIFSCCode = bankIFSCCode
        self.termsAndConditionsData = (try? JSONEncoder().encode(termsAndConditions)) ?? Data()
        self.authorizedSignatoryName = authorizedSignatoryName
    }
}

// MARK: - Client Model

@Model
class Client {
    var id: UUID
    var name: String
    var email: String
    var address: String
    @Attribute(originalName: "taxID") var gstin: String
    var phone: String
    var panNumber: String
    @Relationship(deleteRule: .cascade) var invoices: [Invoice]?

    init(
        id: UUID = UUID(),
        name: String = "",
        email: String = "",
        address: String = "",
        gstin: String = "",
        phone: String = "",
        panNumber: String = ""
    ) {
        self.id = id
        self.name = name
        self.email = email
        self.address = address
        self.gstin = gstin
        self.phone = phone
        self.panNumber = panNumber
    }
}

// MARK: - Work Rate Item Model

@Model
class WorkRateItem {
    var id: UUID
    var title: String
    var hsnCode: String
    var unitRate: Double
    var defaultTaxPercentage: Double

    init(
        id: UUID = UUID(),
        title: String = "",
        hsnCode: String = "",
        unitRate: Double = 0.0,
        defaultTaxPercentage: Double = 18.0
    ) {
        self.id = id
        self.title = title
        self.hsnCode = hsnCode
        self.unitRate = unitRate
        self.defaultTaxPercentage = defaultTaxPercentage
    }
}

// MARK: - Invoice Status

enum InvoiceStatus: String, CaseIterable, Codable {
    case draft = "Draft"
    case sent = "Sent"
    case paid = "Paid"

    var color: String {
        switch self {
        case .draft: return "orange"
        case .sent: return "blue"
        case .paid: return "green"
        }
    }

    var systemImage: String {
        switch self {
        case .draft: return "pencil.circle.fill"
        case .sent: return "paperplane.fill"
        case .paid: return "checkmark.seal.fill"
        }
    }
}

// MARK: - Invoice Line Item (Codable struct stored as JSON)

struct LineItem: Codable, Identifiable {
    var id: UUID = UUID()
    var title: String
    var hsnCode: String
    var quantity: Double
    var unitPrice: Double
    var taxPercentage: Double

    var subtotal: Double { quantity * unitPrice }
    var cgst: Double { subtotal * (taxPercentage / 2) / 100 }
    var sgst: Double { subtotal * (taxPercentage / 2) / 100 }
    var total: Double { subtotal + cgst + sgst }
}

// MARK: - Invoice Model

@Model
class Invoice {
    var id: UUID
    var invoiceNumber: String
    var dateCreated: Date
    var clientName: String
    var clientEmail: String
    var clientAddress: String
    var clientGSTIN: String
    var clientPhone: String
    var clientPAN: String
    var lineItemsData: Data   // JSON-encoded [LineItem]
    var subtotal: Double
    var taxTotal: Double
    var grandTotal: Double
    var signatureData: Data?
    var pdfFilename: String
    var statusRaw: String

    var status: InvoiceStatus {
        get { InvoiceStatus(rawValue: statusRaw) ?? .draft }
        set { statusRaw = newValue.rawValue }
    }

    var lineItems: [LineItem] {
        get {
            (try? JSONDecoder().decode([LineItem].self, from: lineItemsData)) ?? []
        }
        set {
            lineItemsData = (try? JSONEncoder().encode(newValue)) ?? Data()
        }
    }

    init(
        id: UUID = UUID(),
        invoiceNumber: String = "",
        dateCreated: Date = Date(),
        clientName: String = "",
        clientEmail: String = "",
        clientAddress: String = "",
        clientGSTIN: String = "",
        clientPhone: String = "",
        clientPAN: String = "",
        lineItems: [LineItem] = [],
        subtotal: Double = 0,
        taxTotal: Double = 0,
        grandTotal: Double = 0,
        signatureData: Data? = nil,
        pdfFilename: String = "",
        status: InvoiceStatus = .draft
    ) {
        self.id = id
        self.invoiceNumber = invoiceNumber
        self.dateCreated = dateCreated
        self.clientName = clientName
        self.clientEmail = clientEmail
        self.clientAddress = clientAddress
        self.clientGSTIN = clientGSTIN
        self.clientPhone = clientPhone
        self.clientPAN = clientPAN
        self.lineItemsData = (try? JSONEncoder().encode(lineItems)) ?? Data()
        self.subtotal = subtotal
        self.taxTotal = taxTotal
        self.grandTotal = grandTotal
        self.signatureData = signatureData
        self.pdfFilename = pdfFilename
        self.statusRaw = status.rawValue
    }
}

// MARK: - Invoice Number Generator

enum InvoiceNumberGenerator {
    static func next() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyyMM"
        let prefix = "INV-\(formatter.string(from: Date()))-"
        let randomSuffix = String(format: "%04d", Int.random(in: 1000...9999))
        return prefix + randomSuffix
    }
}

// MARK: - Number to Words (for invoice totals)

enum NumberToWords {
    private static let ones = ["", "One", "Two", "Three", "Four", "Five",
                                "Six", "Seven", "Eight", "Nine", "Ten",
                                "Eleven", "Twelve", "Thirteen", "Fourteen",
                                "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
    private static let tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty",
                                "Sixty", "Seventy", "Eighty", "Ninety"]

    static func convert(_ number: Int) -> String {
        if number == 0 { return "Zero" }
        if number < 20 { return ones[number] }
        if number < 100 {
            return tens[number / 10] + (number % 10 != 0 ? " " + ones[number % 10] : "")
        }
        if number < 1000 {
            return ones[number / 100] + " Hundred" + (number % 100 != 0 ? " " + convert(number % 100) : "")
        }
        if number < 100_000 {
            return convert(number / 1000) + " Thousand" + (number % 1000 != 0 ? " " + convert(number % 1000) : "")
        }
        if number < 10_000_000 {
            return convert(number / 100_000) + " Lakh" + (number % 100_000 != 0 ? " " + convert(number % 100_000) : "")
        }
        return convert(number / 10_000_000) + " Crore" + (number % 10_000_000 != 0 ? " " + convert(number % 10_000_000) : "")
    }

    static func inWords(_ amount: Double) -> String {
        let rupees = Int(amount)
        let paise = Int((amount - Double(rupees)) * 100)
        var result = convert(rupees) + " Rupees"
        if paise > 0 {
            result += " and \(convert(paise)) Paise"
        }
        return result + " Only"
    }
}
