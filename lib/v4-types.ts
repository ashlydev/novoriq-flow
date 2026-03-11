import { AuditLog, UserRole } from "@/lib/types";

export type NetworkVisibility = "private" | "public" | "connections";
export type BusinessOperatingStatus = "active" | "busy" | "paused";
export type NetworkBusinessType =
  | "freelancer"
  | "agency"
  | "consulting"
  | "contractor"
  | "services"
  | "trading"
  | "wholesale"
  | "retailer"
  | "distributor"
  | "manufacturer"
  | "logistics";
export type ConnectionStatus = "pending" | "accepted" | "rejected" | "disconnected";
export type ConnectionRole = "supplier" | "buyer" | "both";
export type CatalogStatus = "active" | "archived";
export type CatalogAvailability = "available" | "limited" | "out_of_stock";
export type PurchaseOrderStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected"
  | "fulfilled"
  | "cancelled"
  | "partially_fulfilled";
export type RFQStatus = "draft" | "sent" | "responded" | "accepted" | "closed" | "cancelled";
export type RFQRecipientStatus = "sent" | "viewed" | "responded" | "declined";
export type RFQResponseStatus = "submitted" | "accepted" | "rejected";
export type RelationshipActivityType =
  | "connection"
  | "catalog"
  | "purchase_order"
  | "rfq"
  | "reorder"
  | "profile";
export type NetworkNotificationType =
  | "connection_request"
  | "connection_accepted"
  | "connection_rejected"
  | "purchase_order_received"
  | "purchase_order_accepted"
  | "purchase_order_rejected"
  | "purchase_order_fulfilled"
  | "rfq_received"
  | "rfq_response_received"
  | "reorder_submitted"
  | "catalog_updated"
  | "relationship_activity";

export interface BusinessProfile {
  id: string;
  workspaceId?: string;
  displayName: string;
  businessType: NetworkBusinessType;
  city: string;
  country: string;
  about?: string;
  email?: string;
  phone?: string;
  logoDataUrl?: string;
  visibility: NetworkVisibility;
  operatingStatus: BusinessOperatingStatus;
  productsSummary?: string;
  branchSummary?: string;
  trustedBadgeReady: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NetworkPreference {
  workspaceId: string;
  allowDiscovery: boolean;
  allowConnectionRequests: boolean;
  defaultProfileVisibility: NetworkVisibility;
  defaultCatalogVisibility: NetworkVisibility;
  shareContactDetails: boolean;
  shareBranchSummary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessBookmark {
  id: string;
  workspaceId: string;
  businessProfileId: string;
  createdAt: string;
}

export interface SupplierBusinessLink {
  id: string;
  workspaceId: string;
  supplierId: string;
  businessProfileId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessConnection {
  id: string;
  workspaceId: string;
  requesterBusinessId: string;
  recipientBusinessId: string;
  status: ConnectionStatus;
  relationshipType: ConnectionRole;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
}

export interface SupplierCatalog {
  id: string;
  businessProfileId: string;
  title: string;
  description?: string;
  visibility: NetworkVisibility;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierCatalogItem {
  id: string;
  catalogId: string;
  sourceItemId?: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  category?: string;
  availability: CatalogAvailability;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderLineItem {
  id: string;
  catalogItemId?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface PurchaseOrderHistoryEntry {
  id: string;
  status: PurchaseOrderStatus;
  actorBusinessId: string;
  actorUserId?: string;
  note?: string;
  createdAt: string;
}

export interface NetworkPurchaseOrder {
  id: string;
  workspaceId: string;
  buyerBusinessId: string;
  supplierBusinessId: string;
  reference: string;
  status: PurchaseOrderStatus;
  issueDate: string;
  expectedDate?: string;
  notes?: string;
  instructions?: string;
  branchId?: string;
  createdBy: string;
  linkedPurchaseId?: string;
  sourceCatalogId?: string;
  lineItems: PurchaseOrderLineItem[];
  history: PurchaseOrderHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface RFQLineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
}

export interface NetworkRFQRecipient {
  id: string;
  rfqId: string;
  supplierBusinessId: string;
  status: RFQRecipientStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RFQResponseLineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface NetworkRFQResponse {
  id: string;
  rfqId: string;
  recipientId: string;
  supplierBusinessId: string;
  status: RFQResponseStatus;
  notes?: string;
  leadTimeDays?: number;
  lineItems: RFQResponseLineItem[];
  submittedAt: string;
  updatedAt: string;
}

export interface NetworkRFQ {
  id: string;
  workspaceId: string;
  requesterBusinessId: string;
  reference: string;
  title: string;
  status: RFQStatus;
  dueDate?: string;
  notes?: string;
  branchId?: string;
  createdBy: string;
  lineItems: RFQLineItem[];
  recipientIds: string[];
  acceptedResponseId?: string;
  convertedPurchaseOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RelationshipActivity {
  id: string;
  workspaceId: string;
  businessProfileId: string;
  connectionId?: string;
  type: RelationshipActivityType;
  title: string;
  message: string;
  href?: string;
  createdAt: string;
}

export interface NetworkNotification {
  id: string;
  workspaceId: string;
  type: NetworkNotificationType;
  title: string;
  message: string;
  href?: string;
  relatedBusinessId?: string;
  relatedEntityId?: string;
  visibleToRoles?: UserRole[];
  isRead: boolean;
  createdAt: string;
}

export interface FlowV4State {
  businessProfiles: BusinessProfile[];
  preferences: NetworkPreference[];
  bookmarks: BusinessBookmark[];
  supplierLinks: SupplierBusinessLink[];
  connections: BusinessConnection[];
  catalogs: SupplierCatalog[];
  catalogItems: SupplierCatalogItem[];
  purchaseOrders: NetworkPurchaseOrder[];
  rfqs: NetworkRFQ[];
  rfqRecipients: NetworkRFQRecipient[];
  rfqResponses: NetworkRFQResponse[];
  relationshipActivities: RelationshipActivity[];
  networkNotifications: NetworkNotification[];
  networkAuditLogs: AuditLog[];
}
