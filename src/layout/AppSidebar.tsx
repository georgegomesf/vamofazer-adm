"use client";
import React, { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useProject } from "../context/ProjectContext";
import { useSession } from "next-auth/react";
import {
  SettingsIcon,
  UserIcon,
  DocsIcon,
  GridIcon,
  PageIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Recursos",
    subItems: [
      { name: "Ações", path: "/adm/actions" },
      { name: "Grupos", path: "/adm/groups" },
      { name: "Plugins", path: "/adm/plugins" },
    ],
  },
  {
    icon: <SettingsIcon />,
    name: "Configurações",
    subItems: [
      { name: "Projeto", path: "/adm/projeto" },
      { name: "Usuários", path: "/adm/usuarios" },
    ],
  },
  {
    icon: <UserIcon />,
    name: "Conta",
    subItems: [
      { name: "Meu Perfil", path: "/adm/perfil" },
    ],
  },
];

const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const { data: session } = useSession();
  const pathname = usePathname();

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <div
              className={`menu-item group menu-item-inactive ${!isExpanded && !isHovered
                ? "lg:justify-center"
                : "lg:justify-start"
                }`}
            >
              <span className="menu-item-icon-inactive">
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
            </div>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                onClick={() => isMobileOpen && toggleMobileSidebar()}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div className="transition-all duration-300">
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      onClick={() => isMobileOpen && toggleMobileSidebar()}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  const { project } = useProject();

  return (
    <aside
      className={`fixed flex flex-col pt-20 lg:pt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 hidden lg:flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className={`flex items-center ${project?.theme === "dark" && project?.logoHorizontalUrl ? "bg-gray-900 p-2 rounded-xl" : ""}`}>
              {project?.logoHorizontalUrl ? (
                <img
                  src={project.logoHorizontalUrl}
                  alt={project.name || "Logo"}
                  className="max-h-12 w-auto object-contain"
                />
              ) : (
                <>
                  <Image
                    className="dark:hidden"
                    src="/images/logo/logo.svg"
                    alt="Logo"
                    width={150}
                    height={40}
                  />
                  <Image
                    className="hidden dark:block"
                    src="/images/logo/logo-dark.svg"
                    alt="Logo"
                    width={150}
                    height={40}
                  />
                </>
              )}
            </div>
          ) : (
            <div className={`flex justify-center items-center w-10 h-10 ${project?.theme === "dark" && project?.logoUrl ? "bg-gray-900 p-1.5 rounded-lg" : ""}`}>
              {project?.logoUrl ? (
                <img
                  src={project.logoUrl}
                  alt={project.name || "Logo"}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image
                  src="/images/logo/logo-icon.svg"
                  alt="Logo"
                  width={32}
                  height={32}
                />
              )}
            </div>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  ""
                ) : (
                  ""
                )}
              </h2>
              {(() => {
                const userRole = (session?.user as any)?.role;
                const projectRole = (session?.user as any)?.projectRole;
                const isAdmin = userRole === "ADMIN" || projectRole === "admin";
                const isManager = projectRole === "manager";
                const isEditor = projectRole === "editor";

                if (!isAdmin && !isManager && !isEditor) return null;

                let allowedNavItems = navItems.filter((item) => {
                  if (item.name === "Configurações") return isAdmin || isManager;
                  if (item.name === "Recursos") return isAdmin || isManager;
                  return true;
                });

                if (isManager) {
                  allowedNavItems = allowedNavItems.map(item => {
                    if (item.name === "Configurações") {
                      return {
                        ...item,
                        subItems: item.subItems?.filter(sub => sub.path !== "/adm/projeto")
                      };
                    }
                    return item;
                  });
                }

                return renderMenuItems(allowedNavItems, "main");
              })()}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
