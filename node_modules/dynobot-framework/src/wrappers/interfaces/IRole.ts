export interface IRole {
	/**
	 * Get the role id.
	 * @return The role id
	 */
	getId(): number;

	/**
	 * Get the role name.
	 * @return The role name
	 */
	getName(): string;

	/**
	 * Get the role color.
	 * @return The role color
	 */
	getColor(): number;

	/**
	 * Get the role permissions.
	 * @return The role permissions
	 */
	getPermissions(): number;

}