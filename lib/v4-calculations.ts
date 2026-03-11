import { AuditLog, Purchase } from "@/lib/types";
import {
  BusinessConnection,
  BusinessProfile,
  BusinessBookmark,
  NetworkNotification,
  NetworkPurchaseOrder,
  NetworkRFQ,
  NetworkRFQRecipient,
  NetworkRFQResponse,
  RelationshipActivity,
  SupplierBusinessLink,
  SupplierCatalog,
  SupplierCatalogItem
} from "@/lib/v4-types";

function startOfDay(dateLike: string) {
  const date = new Date(dateLike);
  date.setHours(0, 0, 0, 0);
  return date;
}

function diffHours(fromDate: string, toDate: string) {
  return (new Date(toDate).getTime() - new Date(fromDate).getTime()) / 3600000;
}

function diffDays(fromDate: string, toDate: string) {
  return Math.floor(
    (startOfDay(toDate).getTime() - startOfDay(fromDate).getTime()) / 86400000
  );
}

export function getCurrentBusinessProfileId(workspaceId?: string) {
  return workspaceId ? `business-${workspaceId}` : undefined;
}

export function getConnectionForBusiness(
  connections: BusinessConnection[],
  currentBusinessId: string | undefined,
  targetBusinessId: string
) {
  if (!currentBusinessId) {
    return undefined;
  }

  return connections.find(
    (connection) =>
      (connection.requesterBusinessId === currentBusinessId &&
        connection.recipientBusinessId === targetBusinessId) ||
      (connection.requesterBusinessId === targetBusinessId &&
        connection.recipientBusinessId === currentBusinessId)
  );
}

export function isConnectedBusiness(
  connections: BusinessConnection[],
  currentBusinessId: string | undefined,
  targetBusinessId: string
) {
  return (
    getConnectionForBusiness(connections, currentBusinessId, targetBusinessId)?.status ===
    "accepted"
  );
}

export function isBusinessVisible(params: {
  profile: BusinessProfile;
  currentBusinessId?: string;
  connections: BusinessConnection[];
}) {
  const { profile, currentBusinessId, connections } = params;
  if (profile.id === currentBusinessId) {
    return true;
  }

  if (profile.visibility === "public") {
    return true;
  }

  if (profile.visibility === "connections") {
    return isConnectedBusiness(connections, currentBusinessId, profile.id);
  }

  return false;
}

export function getVisibleBusinessProfiles(params: {
  profiles: BusinessProfile[];
  currentBusinessId?: string;
  connections: BusinessConnection[];
}) {
  return params.profiles.filter((profile) =>
    isBusinessVisible({
      profile,
      currentBusinessId: params.currentBusinessId,
      connections: params.connections
    })
  );
}

export function isCatalogVisible(params: {
  catalog: SupplierCatalog;
  currentBusinessId?: string;
  catalogBusinessId: string;
  connections: BusinessConnection[];
}) {
  if (params.catalogBusinessId === params.currentBusinessId) {
    return true;
  }

  if (params.catalog.visibility === "public") {
    return true;
  }

  if (params.catalog.visibility === "connections") {
    return isConnectedBusiness(
      params.connections,
      params.currentBusinessId,
      params.catalogBusinessId
    );
  }

  return false;
}

export function getVisibleCatalogs(params: {
  catalogs: SupplierCatalog[];
  profiles: BusinessProfile[];
  currentBusinessId?: string;
  connections: BusinessConnection[];
}) {
  return params.catalogs.filter((catalog) => {
    const owner = params.profiles.find((profile) => profile.id === catalog.businessProfileId);
    return owner
      ? isCatalogVisible({
          catalog,
          currentBusinessId: params.currentBusinessId,
          catalogBusinessId: owner.id,
          connections: params.connections
        })
      : false;
  });
}

export function getTrustIndicators(params: {
  businessId: string;
  profiles: BusinessProfile[];
  connections: BusinessConnection[];
  purchaseOrders: NetworkPurchaseOrder[];
  rfqRecipients: NetworkRFQRecipient[];
  rfqResponses: NetworkRFQResponse[];
}) {
  const profile = params.profiles.find((entry) => entry.id === params.businessId);
  const acceptedConnection = params.connections.find(
    (connection) =>
      connection.status === "accepted" &&
      (connection.requesterBusinessId === params.businessId ||
        connection.recipientBusinessId === params.businessId)
  );
  const supplierOrders = params.purchaseOrders.filter(
    (order) => order.supplierBusinessId === params.businessId
  );
  const completedOrderCount = supplierOrders.filter(
    (order) => order.status === "fulfilled"
  ).length;
  const acceptedOrderCount = supplierOrders.filter((order) =>
    ["accepted", "fulfilled", "partially_fulfilled"].includes(order.status)
  ).length;
  const cancelledOrderCount = supplierOrders.filter((order) =>
    ["cancelled", "rejected"].includes(order.status)
  ).length;
  const recipientIds = params.rfqRecipients
    .filter((recipient) => recipient.supplierBusinessId === params.businessId)
    .map((recipient) => recipient.id);
  const responses = params.rfqResponses.filter((response) =>
    recipientIds.includes(response.recipientId)
  );
  const avgResponseHours = responses.length
    ? responses.reduce((total, response) => {
        const recipient = params.rfqRecipients.find((entry) => entry.id === response.recipientId);
        return total + diffHours(recipient?.createdAt || response.submittedAt, response.submittedAt);
      }, 0) / responses.length
    : 0;
  const profileCompletenessFields = [
    profile?.displayName,
    profile?.city,
    profile?.country,
    profile?.email,
    profile?.phone,
    profile?.about,
    profile?.productsSummary,
    profile?.logoDataUrl
  ];
  const profileCompleteness = Math.round(
    (profileCompletenessFields.filter(Boolean).length / profileCompletenessFields.length) * 100
  );

  return {
    acceptedOrderCount,
    completedOrderCount,
    cancelledOrderCount,
    averageResponseHours: Math.round(avgResponseHours),
    relationshipAgeDays: acceptedConnection
      ? diffDays(acceptedConnection.createdAt, new Date().toISOString())
      : 0,
    profileCompleteness
  };
}

export function getRelationshipTimeline(params: {
  currentBusinessId?: string;
  businessId?: string;
  connections: BusinessConnection[];
  purchaseOrders: NetworkPurchaseOrder[];
  rfqs: NetworkRFQ[];
  rfqRecipients: NetworkRFQRecipient[];
  rfqResponses: NetworkRFQResponse[];
  relationshipActivities: RelationshipActivity[];
}) {
  if (!params.currentBusinessId || !params.businessId) {
    return [];
  }

  const orderEvents = params.purchaseOrders
    .filter(
      (order) =>
        [order.buyerBusinessId, order.supplierBusinessId].includes(params.currentBusinessId || "") &&
        [order.buyerBusinessId, order.supplierBusinessId].includes(params.businessId || "")
    )
    .map((order) => ({
      id: `po-${order.id}`,
      createdAt: order.updatedAt,
      title: `Purchase order ${order.reference}`,
      message: `Status is ${order.status.replaceAll("_", " ")}.`,
      href: `/app/network/orders/${order.id}`
    }));
  const rfqIds = params.rfqRecipients
    .filter((recipient) => recipient.supplierBusinessId === params.businessId)
    .map((recipient) => recipient.rfqId);
  const rfqEvents = params.rfqs
    .filter(
      (rfq) =>
        rfq.requesterBusinessId === params.currentBusinessId && rfqIds.includes(rfq.id)
    )
    .map((rfq) => ({
      id: `rfq-${rfq.id}`,
      createdAt: rfq.updatedAt,
      title: `RFQ ${rfq.reference}`,
      message: `Status is ${rfq.status.replaceAll("_", " ")}.`,
      href: `/app/network/rfqs/${rfq.id}`
    }));
  const responseEvents = params.rfqResponses
    .filter((response) => response.supplierBusinessId === params.businessId)
    .map((response) => ({
      id: `rfq-response-${response.id}`,
      createdAt: response.updatedAt,
      title: "Supplier quote response",
      message: `Response is ${response.status.replaceAll("_", " ")}.`,
      href: `/app/network/rfqs/${response.rfqId}`
    }));
  const activityEvents = params.relationshipActivities
    .filter((activity) => activity.businessProfileId === params.businessId)
    .map((activity) => ({
      id: activity.id,
      createdAt: activity.createdAt,
      title: activity.title,
      message: activity.message,
      href: activity.href
    }));

  return [...orderEvents, ...rfqEvents, ...responseEvents, ...activityEvents].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export function getNetworkSummary(params: {
  currentBusinessId?: string;
  connections: BusinessConnection[];
  purchaseOrders: NetworkPurchaseOrder[];
  rfqs: NetworkRFQ[];
  rfqRecipients: NetworkRFQRecipient[];
  notifications: NetworkNotification[];
  bookmarks: BusinessBookmark[];
}) {
  if (!params.currentBusinessId) {
    return {
      connectedBusinesses: 0,
      pendingConnectionRequests: 0,
      outgoingPurchaseOrders: 0,
      incomingPurchaseOrders: 0,
      openRFQs: 0,
      pendingSupplierResponses: 0,
      bookmarks: 0
    };
  }

  const connectedBusinesses = params.connections.filter(
    (connection) =>
      connection.status === "accepted" &&
      (connection.requesterBusinessId === params.currentBusinessId ||
        connection.recipientBusinessId === params.currentBusinessId)
  ).length;
  const pendingConnectionRequests = params.connections.filter(
    (connection) =>
      connection.status === "pending" &&
      connection.recipientBusinessId === params.currentBusinessId
  ).length;
  const outgoingPurchaseOrders = params.purchaseOrders.filter(
    (order) => order.buyerBusinessId === params.currentBusinessId
  ).length;
  const incomingPurchaseOrders = params.purchaseOrders.filter(
    (order) => order.supplierBusinessId === params.currentBusinessId
  ).length;
  const openRFQs = params.rfqs.filter(
    (rfq) =>
      rfq.requesterBusinessId === params.currentBusinessId &&
      ["sent", "responded"].includes(rfq.status)
  ).length;
  const pendingSupplierResponses = params.rfqRecipients.filter((recipient) => {
    const rfq = params.rfqs.find((entry) => entry.id === recipient.rfqId);
    return (
      rfq?.requesterBusinessId === params.currentBusinessId &&
      ["sent", "viewed"].includes(recipient.status)
    );
  }).length;

  return {
    connectedBusinesses,
    pendingConnectionRequests,
    outgoingPurchaseOrders,
    incomingPurchaseOrders,
    openRFQs,
    pendingSupplierResponses,
    bookmarks: params.bookmarks.filter((bookmark) => bookmark.workspaceId).length
  };
}

export function getReorderSuggestions(params: {
  currentBusinessId?: string;
  purchaseOrders: NetworkPurchaseOrder[];
  purchases: Purchase[];
  supplierLinks: SupplierBusinessLink[];
  profiles: BusinessProfile[];
}) {
  const orderSuggestions = params.purchaseOrders
    .filter(
      (order) =>
        order.buyerBusinessId === params.currentBusinessId &&
        ["accepted", "fulfilled", "partially_fulfilled"].includes(order.status)
    )
    .map((order) => ({
      id: `order-${order.id}`,
      source: "purchase_order" as const,
      title: `Repeat ${order.reference}`,
      businessId: order.supplierBusinessId,
      businessName:
        params.profiles.find((profile) => profile.id === order.supplierBusinessId)?.displayName ||
        "Supplier",
      href: `/app/network/orders/${order.id}`,
      createdAt: order.updatedAt
    }));
  const purchaseSuggestions = params.purchases
    .map((purchase) => {
      const link = params.supplierLinks.find((entry) => entry.supplierId === purchase.supplierId);
      if (!link) {
        return undefined;
      }

      return {
        id: `purchase-${purchase.id}`,
        source: "purchase" as const,
        title: `Reorder ${purchase.reference}`,
        businessId: link.businessProfileId,
        businessName:
          params.profiles.find((profile) => profile.id === link.businessProfileId)?.displayName ||
          "Supplier",
        href: `/app/purchases/${purchase.id}`,
        createdAt: purchase.updatedAt
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    source: "purchase";
    title: string;
    businessId: string;
    businessName: string;
    href: string;
    createdAt: string;
  }>;

  return [...orderSuggestions, ...purchaseSuggestions]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 8);
}

export function getSupplierActivitySummary(params: {
  profiles: BusinessProfile[];
  purchaseOrders: NetworkPurchaseOrder[];
  rfqResponses: NetworkRFQResponse[];
}) {
  return params.profiles
    .map((profile) => {
      const orders = params.purchaseOrders.filter((order) => order.supplierBusinessId === profile.id);
      const responses = params.rfqResponses.filter(
        (response) => response.supplierBusinessId === profile.id
      );
      return {
        profile,
        orderCount: orders.length,
        fulfilledCount: orders.filter((order) => order.status === "fulfilled").length,
        responseCount: responses.length
      };
    })
    .filter((entry) => entry.orderCount || entry.responseCount)
    .sort((left, right) => right.orderCount + right.responseCount - (left.orderCount + left.responseCount));
}

export function mergeNetworkAuditLogs(coreLogs: AuditLog[], networkLogs: AuditLog[]) {
  return [...coreLogs, ...networkLogs].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}
