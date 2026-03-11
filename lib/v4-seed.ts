import { AuditLog } from "@/lib/types";
import { getCurrentBusinessProfileId } from "@/lib/v4-calculations";
import { FlowV4State } from "@/lib/v4-types";

function timestamp(daysOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
}

const currentBusinessId = getCurrentBusinessProfileId("workspace-demo") || "business-workspace-demo";

export function createEmptyFlowV4State(): FlowV4State {
  return {
    businessProfiles: [],
    preferences: [],
    bookmarks: [],
    supplierLinks: [],
    connections: [],
    catalogs: [],
    catalogItems: [],
    purchaseOrders: [],
    rfqs: [],
    rfqRecipients: [],
    rfqResponses: [],
    relationshipActivities: [],
    networkNotifications: [],
    networkAuditLogs: []
  };
}

const seededAuditLogs: AuditLog[] = [
  {
    id: "audit-network-001",
    workspaceId: "workspace-demo",
    entityType: "business_connection",
    entityId: "connection-pixel",
    action: "connected",
    actorUserId: "user-demo-owner",
    actorRole: "owner",
    title: "Connected to Pixel Print House",
    summary: "A supplier network relationship was established for repeat print sourcing.",
    createdAt: timestamp(-18)
  },
  {
    id: "audit-network-002",
    workspaceId: "workspace-demo",
    entityType: "purchase_order",
    entityId: "po-002",
    action: "accepted",
    actorUserId: "user-demo-owner",
    actorRole: "owner",
    title: "Purchase order accepted",
    summary: "Northwind Packaging accepted the latest packaging order.",
    createdAt: timestamp(-6)
  }
];

export const seedFlowV4State: FlowV4State = {
  businessProfiles: [
    {
      id: currentBusinessId,
      workspaceId: "workspace-demo",
      displayName: "Novoriq Creative Studio",
      businessType: "agency",
      city: "Harare",
      country: "Zimbabwe",
      about:
        "Creative studio focused on brand systems, campaigns, digital launches, and print execution for growing SMEs.",
      email: "hello@novoriqcreative.co.zw",
      phone: "+263 77 120 3030",
      logoDataUrl: "",
      visibility: "public",
      operatingStatus: "active",
      productsSummary: "Brand retainers, landing pages, campaign creative, print collateral.",
      branchSummary: "Avondale studio with support from Bulawayo operations branch.",
      trustedBadgeReady: false,
      createdAt: timestamp(-60),
      updatedAt: timestamp(-2)
    },
    {
      id: "business-pixel",
      displayName: "Pixel Print House",
      businessType: "manufacturer",
      city: "Harare",
      country: "Zimbabwe",
      about: "Commercial print supplier for banners, labels, flyers, packaging, and signage.",
      email: "sales@pixelprint.co.zw",
      phone: "+263 77 310 3300",
      visibility: "public",
      operatingStatus: "active",
      productsSummary: "Print runs, signage, labels, promo materials.",
      trustedBadgeReady: false,
      createdAt: timestamp(-90),
      updatedAt: timestamp(-1)
    },
    {
      id: "business-northwind",
      displayName: "Northwind Packaging",
      businessType: "wholesale",
      city: "Harare",
      country: "Zimbabwe",
      about: "Packaging partner for cartons, wraps, labels, and branded delivery materials.",
      email: "accounts@northwindpackaging.africa",
      phone: "+263 77 901 1100",
      visibility: "public",
      operatingStatus: "active",
      productsSummary: "Cartons, labels, wraps, flexible packaging.",
      trustedBadgeReady: false,
      createdAt: timestamp(-88),
      updatedAt: timestamp(-4)
    },
    {
      id: "business-metro",
      displayName: "Metro Telecom",
      businessType: "services",
      city: "Harare",
      country: "Zimbabwe",
      about: "Business fibre, connectivity, and telecom services for SME offices.",
      email: "billing@metrotelecom.africa",
      phone: "+263 78 221 0012",
      visibility: "connections",
      operatingStatus: "active",
      productsSummary: "Fibre packages, support, branch connectivity.",
      trustedBadgeReady: false,
      createdAt: timestamp(-100),
      updatedAt: timestamp(-6)
    },
    {
      id: "business-orbit",
      displayName: "Orbit Logistics",
      businessType: "logistics",
      city: "Harare",
      country: "Zimbabwe",
      about: "Logistics and fleet management business working with SME suppliers across Zimbabwe.",
      email: "accounts@orbitlogistics.africa",
      phone: "+263 77 998 8855",
      visibility: "public",
      operatingStatus: "active",
      productsSummary: "Transport retainers, dispatch support, fleet branding.",
      trustedBadgeReady: false,
      createdAt: timestamp(-120),
      updatedAt: timestamp(-3)
    },
    {
      id: "business-greenfield",
      displayName: "Greenfield Hardware",
      businessType: "retailer",
      city: "Harare",
      country: "Zimbabwe",
      about: "Hardware retailer sourcing branding, packaging, and supplier support for branch launches.",
      email: "admin@greenfield.co.zw",
      phone: "+263 78 800 1001",
      visibility: "public",
      operatingStatus: "busy",
      productsSummary: "Retail hardware and branch opening packs.",
      trustedBadgeReady: false,
      createdAt: timestamp(-130),
      updatedAt: timestamp(-7)
    }
  ],
  preferences: [
    {
      workspaceId: "workspace-demo",
      allowDiscovery: true,
      allowConnectionRequests: true,
      defaultProfileVisibility: "public",
      defaultCatalogVisibility: "connections",
      shareContactDetails: true,
      shareBranchSummary: true,
      createdAt: timestamp(-60),
      updatedAt: timestamp(-2)
    }
  ],
  bookmarks: [
    {
      id: "bookmark-pixel",
      workspaceId: "workspace-demo",
      businessProfileId: "business-pixel",
      createdAt: timestamp(-9)
    }
  ],
  supplierLinks: [
    {
      id: "supplier-link-pixel",
      workspaceId: "workspace-demo",
      supplierId: "supp-pixel",
      businessProfileId: "business-pixel",
      createdAt: timestamp(-18),
      updatedAt: timestamp(-4)
    },
    {
      id: "supplier-link-northwind",
      workspaceId: "workspace-demo",
      supplierId: "supp-northwind",
      businessProfileId: "business-northwind",
      createdAt: timestamp(-17),
      updatedAt: timestamp(-5)
    },
    {
      id: "supplier-link-metro",
      workspaceId: "workspace-demo",
      supplierId: "supp-telecom",
      businessProfileId: "business-metro",
      createdAt: timestamp(-12),
      updatedAt: timestamp(-6)
    }
  ],
  connections: [
    {
      id: "connection-pixel",
      workspaceId: "workspace-demo",
      requesterBusinessId: currentBusinessId,
      recipientBusinessId: "business-pixel",
      status: "accepted",
      relationshipType: "supplier",
      notes: "Preferred print supplier for urgent campaign work.",
      createdAt: timestamp(-18),
      updatedAt: timestamp(-16),
      respondedAt: timestamp(-16)
    },
    {
      id: "connection-northwind",
      workspaceId: "workspace-demo",
      requesterBusinessId: currentBusinessId,
      recipientBusinessId: "business-northwind",
      status: "accepted",
      relationshipType: "supplier",
      notes: "Packaging partner for recurring client launch materials.",
      createdAt: timestamp(-17),
      updatedAt: timestamp(-15),
      respondedAt: timestamp(-15)
    },
    {
      id: "connection-orbit",
      workspaceId: "workspace-demo",
      requesterBusinessId: "business-orbit",
      recipientBusinessId: currentBusinessId,
      status: "accepted",
      relationshipType: "buyer",
      notes: "Orbit also buys branded fleet collateral from the studio.",
      createdAt: timestamp(-30),
      updatedAt: timestamp(-28),
      respondedAt: timestamp(-28)
    },
    {
      id: "connection-greenfield",
      workspaceId: "workspace-demo",
      requesterBusinessId: "business-greenfield",
      recipientBusinessId: currentBusinessId,
      status: "pending",
      relationshipType: "buyer",
      notes: "Requested connection for repeat launch materials sourcing.",
      createdAt: timestamp(-1),
      updatedAt: timestamp(-1)
    }
  ],
  catalogs: [
    {
      id: "catalog-own",
      businessProfileId: currentBusinessId,
      title: "Novoriq Studio Services",
      description: "Standard service and campaign packages for repeat buyers.",
      visibility: "connections",
      status: "active",
      createdAt: timestamp(-20),
      updatedAt: timestamp(-2)
    },
    {
      id: "catalog-pixel",
      businessProfileId: "business-pixel",
      title: "Pixel Print Trade Catalog",
      description: "Fast-moving print lines for connected business buyers.",
      visibility: "public",
      status: "active",
      createdAt: timestamp(-32),
      updatedAt: timestamp(-1)
    },
    {
      id: "catalog-northwind",
      businessProfileId: "business-northwind",
      title: "Northwind Packaging Basics",
      description: "Core packaging formats for repeat wholesale customers.",
      visibility: "connections",
      status: "active",
      createdAt: timestamp(-30),
      updatedAt: timestamp(-4)
    }
  ],
  catalogItems: [
    {
      id: "catalog-item-own-1",
      catalogId: "catalog-own",
      sourceItemId: "item-brand-retainer",
      name: "Brand Retainer",
      description: "Monthly creative support retainer.",
      price: 650,
      unit: "month",
      category: "Services",
      availability: "available",
      createdAt: timestamp(-20),
      updatedAt: timestamp(-2)
    },
    {
      id: "catalog-item-own-2",
      catalogId: "catalog-own",
      sourceItemId: "item-website-sprint",
      name: "Landing Page Sprint",
      description: "Rapid campaign page design and build.",
      price: 900,
      unit: "project",
      category: "Digital",
      availability: "available",
      createdAt: timestamp(-20),
      updatedAt: timestamp(-2)
    },
    {
      id: "catalog-item-pixel-1",
      catalogId: "catalog-pixel",
      name: "Promo Flyer Run",
      description: "A5 flyer batch, 5,000 prints.",
      price: 240,
      unit: "batch",
      category: "Print",
      availability: "available",
      createdAt: timestamp(-32),
      updatedAt: timestamp(-3)
    },
    {
      id: "catalog-item-pixel-2",
      catalogId: "catalog-pixel",
      name: "Roll-up Banner",
      description: "Portable branded banner stand.",
      price: 95,
      unit: "each",
      category: "Signage",
      availability: "limited",
      createdAt: timestamp(-32),
      updatedAt: timestamp(-1)
    },
    {
      id: "catalog-item-northwind-1",
      catalogId: "catalog-northwind",
      name: "Branded Carton Pack",
      description: "Custom cartons and labels for campaign shipments.",
      price: 380,
      unit: "pack",
      category: "Packaging",
      availability: "available",
      createdAt: timestamp(-30),
      updatedAt: timestamp(-4)
    }
  ],
  purchaseOrders: [
    {
      id: "po-001",
      workspaceId: "workspace-demo",
      buyerBusinessId: currentBusinessId,
      supplierBusinessId: "business-pixel",
      reference: "PO-2026-001",
      status: "sent",
      issueDate: timestamp(-2),
      expectedDate: timestamp(4),
      notes: "Needed for upcoming Citron launch assets.",
      instructions: "Please confirm banner stock before dispatch.",
      createdBy: "user-demo-manager",
      sourceCatalogId: "catalog-pixel",
      lineItems: [
        {
          id: "po-line-001",
          catalogItemId: "catalog-item-pixel-2",
          name: "Roll-up Banner",
          description: "Two display banners",
          quantity: 2,
          unit: "each",
          unitPrice: 95
        }
      ],
      history: [
        {
          id: "po-history-001",
          status: "sent",
          actorBusinessId: currentBusinessId,
          actorUserId: "user-demo-manager",
          note: "Initial order submitted to supplier.",
          createdAt: timestamp(-2)
        }
      ],
      createdAt: timestamp(-2),
      updatedAt: timestamp(-2)
    },
    {
      id: "po-002",
      workspaceId: "workspace-demo",
      buyerBusinessId: currentBusinessId,
      supplierBusinessId: "business-northwind",
      reference: "PO-2026-002",
      status: "accepted",
      issueDate: timestamp(-6),
      expectedDate: timestamp(1),
      notes: "Repeat packaging order tied to Sunrise Foods launch.",
      instructions: "Keep label colors aligned to approved artwork.",
      createdBy: "user-demo-owner",
      linkedPurchaseId: "purchase-001",
      sourceCatalogId: "catalog-northwind",
      lineItems: [
        {
          id: "po-line-002",
          catalogItemId: "catalog-item-northwind-1",
          name: "Branded Carton Pack",
          description: "Client launch packaging batch",
          quantity: 1,
          unit: "pack",
          unitPrice: 380
        }
      ],
      history: [
        {
          id: "po-history-002",
          status: "sent",
          actorBusinessId: currentBusinessId,
          actorUserId: "user-demo-owner",
          note: "Submitted as a repeat packaging request.",
          createdAt: timestamp(-6)
        },
        {
          id: "po-history-003",
          status: "accepted",
          actorBusinessId: "business-northwind",
          note: "Supplier confirmed order and production slot.",
          createdAt: timestamp(-5)
        }
      ],
      createdAt: timestamp(-6),
      updatedAt: timestamp(-5)
    },
    {
      id: "po-003",
      workspaceId: "workspace-demo",
      buyerBusinessId: "business-orbit",
      supplierBusinessId: currentBusinessId,
      reference: "PO-2026-003",
      status: "viewed",
      issueDate: timestamp(-1),
      expectedDate: timestamp(10),
      notes: "Fleet branding refresh for two delivery vehicles.",
      instructions: "Share proof before print confirmation.",
      createdBy: "external-orbit",
      sourceCatalogId: "catalog-own",
      lineItems: [
        {
          id: "po-line-003",
          catalogItemId: "catalog-item-own-1",
          name: "Brand Retainer",
          description: "Short campaign support package",
          quantity: 1,
          unit: "month",
          unitPrice: 650
        }
      ],
      history: [
        {
          id: "po-history-004",
          status: "sent",
          actorBusinessId: "business-orbit",
          note: "Orbit submitted a connected buyer order.",
          createdAt: timestamp(-1)
        },
        {
          id: "po-history-005",
          status: "viewed",
          actorBusinessId: currentBusinessId,
          actorUserId: "user-demo-owner",
          note: "Viewed from the supplier-facing network inbox.",
          createdAt: timestamp(0)
        }
      ],
      createdAt: timestamp(-1),
      updatedAt: timestamp(0)
    }
  ],
  rfqs: [
    {
      id: "rfq-001",
      workspaceId: "workspace-demo",
      requesterBusinessId: currentBusinessId,
      reference: "RFQ-2026-001",
      title: "Expo launch materials sourcing",
      status: "responded",
      dueDate: timestamp(2),
      notes: "Looking for pricing on banners and packaging support for a client launch.",
      createdBy: "user-demo-manager",
      lineItems: [
        {
          id: "rfq-line-001",
          name: "Launch banners",
          description: "Portable roll-up banners",
          quantity: 3,
          unit: "each"
        },
        {
          id: "rfq-line-002",
          name: "Campaign cartons",
          description: "Branded shipping cartons",
          quantity: 1,
          unit: "pack"
        }
      ],
      recipientIds: ["rfq-recipient-001", "rfq-recipient-002"],
      createdAt: timestamp(-3),
      updatedAt: timestamp(-1)
    },
    {
      id: "rfq-002",
      workspaceId: "workspace-demo",
      requesterBusinessId: "business-greenfield",
      reference: "RFQ-2026-002",
      title: "Store opening creative package",
      status: "responded",
      dueDate: timestamp(4),
      notes: "Need a quote for a rapid store launch pack.",
      createdBy: "external-greenfield",
      lineItems: [
        {
          id: "rfq-line-003",
          name: "Landing page sprint",
          description: "New launch landing page",
          quantity: 1,
          unit: "project"
        }
      ],
      recipientIds: ["rfq-recipient-003"],
      createdAt: timestamp(-2),
      updatedAt: timestamp(-1)
    }
  ],
  rfqRecipients: [
    {
      id: "rfq-recipient-001",
      rfqId: "rfq-001",
      supplierBusinessId: "business-pixel",
      status: "responded",
      createdAt: timestamp(-3),
      updatedAt: timestamp(-1)
    },
    {
      id: "rfq-recipient-002",
      rfqId: "rfq-001",
      supplierBusinessId: "business-northwind",
      status: "responded",
      createdAt: timestamp(-3),
      updatedAt: timestamp(-1)
    },
    {
      id: "rfq-recipient-003",
      rfqId: "rfq-002",
      supplierBusinessId: currentBusinessId,
      status: "responded",
      createdAt: timestamp(-2),
      updatedAt: timestamp(-1)
    }
  ],
  rfqResponses: [
    {
      id: "rfq-response-001",
      rfqId: "rfq-001",
      recipientId: "rfq-recipient-001",
      supplierBusinessId: "business-pixel",
      status: "submitted",
      notes: "Banner stock is available this week.",
      leadTimeDays: 3,
      lineItems: [
        {
          id: "rfq-response-line-001",
          name: "Launch banners",
          description: "Roll-up banners",
          quantity: 3,
          unit: "each",
          unitPrice: 95
        }
      ],
      submittedAt: timestamp(-1),
      updatedAt: timestamp(-1)
    },
    {
      id: "rfq-response-002",
      rfqId: "rfq-001",
      recipientId: "rfq-recipient-002",
      supplierBusinessId: "business-northwind",
      status: "submitted",
      notes: "Packaging can ship in four days.",
      leadTimeDays: 4,
      lineItems: [
        {
          id: "rfq-response-line-002",
          name: "Campaign cartons",
          description: "Branded carton pack",
          quantity: 1,
          unit: "pack",
          unitPrice: 380
        }
      ],
      submittedAt: timestamp(-1),
      updatedAt: timestamp(-1)
    },
    {
      id: "rfq-response-003",
      rfqId: "rfq-002",
      recipientId: "rfq-recipient-003",
      supplierBusinessId: currentBusinessId,
      status: "submitted",
      notes: "We can start immediately next week.",
      leadTimeDays: 2,
      lineItems: [
        {
          id: "rfq-response-line-003",
          name: "Landing page sprint",
          description: "Design and build",
          quantity: 1,
          unit: "project",
          unitPrice: 900
        }
      ],
      submittedAt: timestamp(-1),
      updatedAt: timestamp(-1)
    }
  ],
  relationshipActivities: [
    {
      id: "activity-network-001",
      workspaceId: "workspace-demo",
      businessProfileId: "business-pixel",
      connectionId: "connection-pixel",
      type: "connection",
      title: "Preferred print connection established",
      message: "Pixel Print House is now a connected supplier for repeat banner and flyer work.",
      href: "/app/network/businesses/business-pixel",
      createdAt: timestamp(-16)
    },
    {
      id: "activity-network-002",
      workspaceId: "workspace-demo",
      businessProfileId: "business-northwind",
      connectionId: "connection-northwind",
      type: "purchase_order",
      title: "Packaging order accepted",
      message: "Northwind accepted PO-2026-002 and confirmed the delivery window.",
      href: "/app/network/orders/po-002",
      createdAt: timestamp(-5)
    },
    {
      id: "activity-network-003",
      workspaceId: "workspace-demo",
      businessProfileId: "business-orbit",
      type: "purchase_order",
      title: "Incoming order received",
      message: "Orbit Logistics sent a new order from the network supplier portal.",
      href: "/app/network/orders/po-003",
      createdAt: timestamp(-1)
    }
  ],
  networkNotifications: [
    {
      id: "network-note-001",
      workspaceId: "workspace-demo",
      type: "connection_request",
      title: "New connection request",
      message: "Greenfield Hardware wants to connect as a buyer.",
      href: "/app/network/connections",
      relatedBusinessId: "business-greenfield",
      isRead: false,
      createdAt: timestamp(-1)
    },
    {
      id: "network-note-002",
      workspaceId: "workspace-demo",
      type: "purchase_order_received",
      title: "Incoming purchase order",
      message: "Orbit Logistics submitted PO-2026-003 to your business.",
      href: "/app/network/orders/po-003",
      relatedBusinessId: "business-orbit",
      relatedEntityId: "po-003",
      isRead: false,
      createdAt: timestamp(-1)
    },
    {
      id: "network-note-003",
      workspaceId: "workspace-demo",
      type: "rfq_response_received",
      title: "Supplier quotes received",
      message: "Two suppliers responded to RFQ-2026-001.",
      href: "/app/network/rfqs/rfq-001",
      relatedEntityId: "rfq-001",
      isRead: false,
      createdAt: timestamp(-1)
    }
  ],
  networkAuditLogs: seededAuditLogs
};

export function upgradeFlowV4State(state?: FlowV4State | null) {
  return {
    ...createEmptyFlowV4State(),
    ...(state || {}),
    businessProfiles: state?.businessProfiles || seedFlowV4State.businessProfiles,
    preferences: state?.preferences || seedFlowV4State.preferences,
    bookmarks: state?.bookmarks || seedFlowV4State.bookmarks,
    supplierLinks: state?.supplierLinks || seedFlowV4State.supplierLinks,
    connections: state?.connections || seedFlowV4State.connections,
    catalogs: state?.catalogs || seedFlowV4State.catalogs,
    catalogItems: state?.catalogItems || seedFlowV4State.catalogItems,
    purchaseOrders: state?.purchaseOrders || seedFlowV4State.purchaseOrders,
    rfqs: state?.rfqs || seedFlowV4State.rfqs,
    rfqRecipients: state?.rfqRecipients || seedFlowV4State.rfqRecipients,
    rfqResponses: state?.rfqResponses || seedFlowV4State.rfqResponses,
    relationshipActivities:
      state?.relationshipActivities || seedFlowV4State.relationshipActivities,
    networkNotifications:
      state?.networkNotifications || seedFlowV4State.networkNotifications,
    networkAuditLogs: state?.networkAuditLogs || seedFlowV4State.networkAuditLogs
  };
}
